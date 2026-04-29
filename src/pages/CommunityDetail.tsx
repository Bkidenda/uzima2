import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Users, MessageCircle, UserPlus, Search, Check, X, Mail, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  cover_image_url: string | null;
}
interface Member { user_id: string; role: string; profile?: { username: string; display_name: string | null } }
interface Profile { id: string; username: string; display_name: string | null }
interface JoinRequest { id: string; user_id: string; status: string; message: string | null; created_at: string; profile?: Profile }
interface Invite { id: string; invitee_id: string; status: string; profile?: Profile }

const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  // Owner-only
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  // Visitor join request
  const [myRequestStatus, setMyRequestStatus] = useState<string | null>(null);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate("/auth", { replace: true }); }, [authLoading, user, navigate]);

  const isOwner = !!(user && community && community.created_by === user.id);

  const load = async () => {
    if (!id || !user) return;
    setLoading(true);
    const [cRes, mRes, convRes] = await Promise.all([
      supabase.from("communities").select("*").eq("id", id).maybeSingle(),
      supabase.from("community_members").select("user_id, role").eq("community_id", id),
      supabase.from("conversations").select("id").eq("community_id", id).maybeSingle(),
    ]);
    const c = cRes.data as Community | null;
    setCommunity(c);
    const ms = (mRes.data ?? []) as Member[];
    const memberIds = ms.map((m) => m.user_id);
    if (memberIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, display_name").in("id", memberIds);
      const map = new Map((profs ?? []).map((p: any) => [p.id, { username: p.username, display_name: p.display_name }]));
      ms.forEach((m) => { m.profile = map.get(m.user_id); });
    }
    setMembers(ms);
    setIsMember(ms.some((m) => m.user_id === user.id));
    setConversationId(convRes.data?.id ?? null);

    // My join request
    const { data: myReq } = await (supabase as any)
      .from("community_join_requests")
      .select("status")
      .eq("community_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    setMyRequestStatus(myReq?.status ?? null);

    // If owner, load pending requests + invites
    if (c && c.created_by === user.id) {
      const [reqRes, invRes] = await Promise.all([
        (supabase as any).from("community_join_requests").select("*").eq("community_id", id).eq("status", "pending"),
        (supabase as any).from("community_invites").select("*").eq("community_id", id).eq("status", "pending"),
      ]);
      const reqs = (reqRes.data ?? []) as JoinRequest[];
      const invs = (invRes.data ?? []) as Invite[];
      const otherIds = [
        ...reqs.map((r) => r.user_id),
        ...invs.map((i) => i.invitee_id),
      ];
      if (otherIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, display_name").in("id", otherIds);
        const m = new Map((profs ?? []).map((p: any) => [p.id, p as Profile]));
        reqs.forEach((r) => { r.profile = m.get(r.user_id); });
        invs.forEach((i) => { i.profile = m.get(i.invitee_id); });
      }
      setRequests(reqs);
      setInvites(invs);
    }

    setLoading(false);
  };

  useEffect(() => { if (user && id) load(); /* eslint-disable-next-line */ }, [id, user?.id]);

  const startDM = async (otherUserId: string) => {
    if (!user || otherUserId === user.id) return;
    const { data, error } = await (supabase as any).rpc("get_or_create_dm", { _other_user_id: otherUserId });
    if (error || !data) {
      toast({ title: "Couldn't start chat", description: error?.message, variant: "destructive" });
      return;
    }
    navigate(`/messages/${data as string}`);
  };

  const requestToJoin = async () => {
    if (!user || !id) return;
    const { error } = await (supabase as any)
      .from("community_join_requests")
      .insert({ community_id: id, user_id: user.id });
    if (error) { toast({ title: "Couldn't send request", description: error.message, variant: "destructive" }); return; }
    setMyRequestStatus("pending");
    toast({ title: "Request sent", description: "The owner will review your request." });
  };

  const cancelMyRequest = async () => {
    if (!user || !id) return;
    await (supabase as any).from("community_join_requests").delete().eq("community_id", id).eq("user_id", user.id);
    setMyRequestStatus(null);
  };

  const approveRequest = async (reqId: string) => {
    const { error } = await (supabase as any).rpc("approve_join_request", { _request_id: reqId });
    if (error) { toast({ title: "Couldn't approve", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Member added" });
    load();
  };
  const declineRequest = async (reqId: string) => {
    const { error } = await (supabase as any).from("community_join_requests").update({ status: "declined" }).eq("id", reqId);
    if (!error) load();
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim() || !user) { setResults([]); return; }
    setSearching(true);
    const memberIds = new Set(members.map((m) => m.user_id));
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .ilike("username", `%${q.trim()}%`)
      .neq("id", user.id)
      .limit(10);
    setResults((data ?? []).filter((p: any) => !memberIds.has(p.id)));
    setSearching(false);
  };

  const sendInvite = async (inviteeId: string) => {
    if (!user || !id) return;
    const { error } = await (supabase as any)
      .from("community_invites")
      .insert({ community_id: id, inviter_id: user.id, invitee_id: inviteeId });
    if (error) { toast({ title: "Couldn't invite", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Invite sent" });
    setSearch(""); setResults([]);
    load();
  };

  const cancelInvite = async (inviteId: string) => {
    await (supabase as any).from("community_invites").delete().eq("id", inviteId);
    load();
  };

  if (loading || !community) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 lg:py-12 max-w-4xl">
        <Link to="/communities" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> All communities
        </Link>
        <div className="rounded-2xl bg-gradient-warm p-6 lg:p-8 ring-1 ring-border/60">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-card text-primary"><Users className="h-6 w-6" /></span>
              <h1 className="mt-3 font-serif text-3xl text-primary">{community.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{members.length} {members.length === 1 ? "member" : "members"}</p>
              {community.description && <p className="mt-3 text-muted-foreground max-w-xl">{community.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!isMember && myRequestStatus !== "pending" && (
                <Button variant="hero" onClick={requestToJoin}>
                  <UserPlus className="h-4 w-4" />Request to join
                </Button>
              )}
              {!isMember && myRequestStatus === "pending" && (
                <Button variant="outline" onClick={cancelMyRequest}>
                  <Clock className="h-4 w-4" />Request pending — cancel
                </Button>
              )}
              {isOwner && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline"><Mail className="h-4 w-4" />Invite people</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Invite a member</DialogTitle></DialogHeader>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by username…" className="pl-9" />
                    </div>
                    <ul className="divide-y divide-border/60 max-h-72 overflow-y-auto">
                      {searching && <li className="py-3 text-sm text-muted-foreground">Searching…</li>}
                      {!searching && search.trim() && results.length === 0 && (
                        <li className="py-3 text-sm text-muted-foreground">No matching members.</li>
                      )}
                      {results.map((r) => (
                        <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                          <span className="text-sm truncate">@{r.username}{r.display_name && <span className="text-muted-foreground"> · {r.display_name}</span>}</span>
                          <Button size="sm" variant="hero" onClick={() => sendInvite(r.id)}>Invite</Button>
                        </li>
                      ))}
                    </ul>
                  </DialogContent>
                </Dialog>
              )}
              {isMember && conversationId && (
                <Button asChild variant="hero"><Link to={`/messages/${conversationId}`}><MessageCircle className="h-4 w-4" />Open chatroom</Link></Button>
              )}
            </div>
          </div>
        </div>

        {isOwner && (requests.length > 0 || invites.length > 0) && (
          <section className="mt-8 grid md:grid-cols-2 gap-5">
            {requests.length > 0 && (
              <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
                <h2 className="font-serif text-lg text-primary">Join requests <span className="text-sm text-muted-foreground">({requests.length})</span></h2>
                <ul className="mt-3 divide-y divide-border/60">
                  {requests.map((r) => (
                    <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                      <span className="text-sm truncate">@{r.profile?.username ?? "member"}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="hero" onClick={() => approveRequest(r.id)}><Check className="h-4 w-4" />Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => declineRequest(r.id)}><X className="h-4 w-4" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {invites.length > 0 && (
              <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
                <h2 className="font-serif text-lg text-primary">Pending invites <span className="text-sm text-muted-foreground">({invites.length})</span></h2>
                <ul className="mt-3 divide-y divide-border/60">
                  {invites.map((i) => (
                    <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                      <span className="text-sm truncate">@{i.profile?.username ?? "member"}</span>
                      <Button size="sm" variant="ghost" onClick={() => cancelInvite(i.id)}><X className="h-4 w-4" />Cancel</Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-serif text-xl text-primary mb-4">Members</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 rounded-xl bg-card p-4 ring-1 ring-border/60">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0">
                    {(m.profile?.username ?? "U").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate">@{m.profile?.username || "member"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                  </div>
                </div>
                {user && m.user_id !== user.id && (
                  <Button variant="ghost" size="sm" onClick={() => startDM(m.user_id)}>
                    <MessageCircle className="h-4 w-4" />Chat
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CommunityDetail;
