import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Users, Plus, ArrowRight, Mail, Check, X, Clock, Globe, Lock } from "lucide-react";

interface Community {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  created_by: string;
  privacy: "public" | "private";
  member_count: number;
  is_member: boolean;
  request_status: string | null;
}
interface InviteRow {
  id: string;
  community_id: string;
  status: string;
  community_name?: string;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const Communities = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const { data: cs } = await supabase.from("communities").select("*").order("created_at", { ascending: false });
    if (!cs) { setCommunities([]); setLoading(false); return; }
    const ids = cs.map((c) => c.id);
    const [membersRes, mineRes, myReqsRes, myInvitesRes] = await Promise.all([
      supabase.from("community_members").select("community_id").in("community_id", ids),
      supabase.from("community_members").select("community_id").in("community_id", ids).eq("user_id", user.id),
      (supabase as any).from("community_join_requests").select("community_id, status").eq("user_id", user.id),
      (supabase as any).from("community_invites").select("id, community_id, status").eq("invitee_id", user.id).eq("status", "pending"),
    ]);
    const counts = new Map<string, number>();
    (membersRes.data ?? []).forEach((m: any) => counts.set(m.community_id, (counts.get(m.community_id) ?? 0) + 1));
    const mine = new Set<string>((mineRes.data ?? []).map((m: any) => m.community_id));
    const reqMap = new Map<string, string>();
    ((myReqsRes.data ?? []) as any[]).forEach((r) => reqMap.set(r.community_id, r.status));
    setCommunities(cs.map((c: any) => ({
      ...c,
      member_count: counts.get(c.id) ?? 0,
      is_member: mine.has(c.id),
      request_status: reqMap.get(c.id) ?? null,
    })));

    // Enrich invites with community names
    const invs = (myInvitesRes.data ?? []) as InviteRow[];
    const nameMap = new Map(cs.map((c: any) => [c.id, c.name]));
    invs.forEach((i) => { i.community_name = nameMap.get(i.community_id) as string | undefined; });
    setInvites(invs);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user?.id]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setCreating(true);
    const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);
    const { data, error } = await supabase
      .from("communities")
      .insert({ name: name.trim(), description: desc.trim() || null, slug, created_by: user.id, privacy } as any)
      .select("id")
      .single();
    setCreating(false);
    if (error) { toast({ title: "Couldn't create community", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Community created!" });
    setOpen(false); setName(""); setDesc(""); setPrivacy("public");
    navigate(`/communities/${data.id}`);
  };

  const requestJoin = async (cid: string) => {
    if (!user) return;
    const { error } = await (supabase as any)
      .from("community_join_requests")
      .insert({ community_id: cid, user_id: user.id });
    if (error) { toast({ title: "Couldn't send request", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Request sent" });
    load();
  };
  const cancelRequest = async (cid: string) => {
    if (!user) return;
    await (supabase as any).from("community_join_requests").delete().eq("community_id", cid).eq("user_id", user.id);
    load();
  };
  const leave = async (cid: string) => {
    if (!user) return;
    await supabase.from("community_members").delete().eq("community_id", cid).eq("user_id", user.id);
    load();
  };

  const acceptInvite = async (inviteId: string) => {
    const { error } = await (supabase as any).rpc("accept_community_invite", { _invite_id: inviteId });
    if (error) { toast({ title: "Couldn't accept", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Welcome to the community!" });
    load();
  };
  const declineInvite = async (inviteId: string) => {
    await (supabase as any).from("community_invites").update({ status: "declined" }).eq("id", inviteId);
    load();
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader eyebrow="Connect" title="Communities" description="Find your people. Join a community to share, encourage, and chat." />
        <section className="container py-8 lg:py-12">
          {invites.length > 0 && (
            <div className="mb-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
              <div className="flex items-center gap-2 mb-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary"><Mail className="h-4 w-4" /></span>
                <h3 className="font-serif text-lg text-primary">Your invitations</h3>
              </div>
              <ul className="divide-y divide-border/60">
                {invites.map((i) => (
                  <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                    <span className="text-sm">You're invited to <span className="font-medium text-primary">{i.community_name ?? "a community"}</span></span>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="hero" onClick={() => acceptInvite(i.id)}><Check className="h-4 w-4" />Accept</Button>
                      <Button size="sm" variant="ghost" onClick={() => declineInvite(i.id)}><X className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-end mb-5">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="sm"><Plus className="h-4 w-4" />Start a community</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Start a community</DialogTitle></DialogHeader>
                <form onSubmit={create} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cname">Name</Label>
                    <Input id="cname" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required placeholder="Plant-Based Cooks" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cdesc">Description</Label>
                    <Textarea id="cdesc" value={desc} maxLength={300} onChange={(e) => setDesc(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Privacy</Label>
                    <RadioGroup value={privacy} onValueChange={(v) => setPrivacy(v as "public" | "private")} className="grid grid-cols-2 gap-2">
                      <label className={`flex items-start gap-2 rounded-xl border p-3 cursor-pointer ${privacy === "public" ? "border-primary bg-secondary/40" : "border-border"}`}>
                        <RadioGroupItem value="public" id="pub" className="mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Public</p>
                          <p className="text-[11px] text-muted-foreground">Anyone can find and request to join.</p>
                        </div>
                      </label>
                      <label className={`flex items-start gap-2 rounded-xl border p-3 cursor-pointer ${privacy === "private" ? "border-primary bg-secondary/40" : "border-border"}`}>
                        <RadioGroupItem value="private" id="prv" className="mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Private</p>
                          <p className="text-[11px] text-muted-foreground">Hidden from explore. Invite only.</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={creating || !name.trim()}>{creating ? "Creating…" : "Create"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : communities.length === 0 ? (
            <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border/60">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><Users className="h-5 w-5" /></div>
              <h3 className="mt-4 font-serif text-xl text-primary">No communities yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Be the first to start one for your church group or interest.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {communities.map((c) => (
                <article key={c.id} className="flex flex-col rounded-2xl bg-card p-5 shadow-card ring-1 ring-border/60">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><Users className="h-5 w-5" /></div>
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${c.privacy === "private" ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"}`}>
                      {c.privacy === "private" ? <><Lock className="h-3 w-3" />Private</> : <><Globe className="h-3 w-3" />Public</>}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-xl text-primary">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.member_count} {c.member_count === 1 ? "member" : "members"}</p>
                  {c.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{c.description}</p>}
                  <div className="mt-auto pt-4 flex items-center gap-2">
                    {c.is_member ? (
                      <>
                        <Button asChild variant="hero" size="sm" className="flex-1"><Link to={`/communities/${c.id}`}>Open<ArrowRight className="h-3.5 w-3.5" /></Link></Button>
                        {c.created_by !== user.id && <Button variant="ghost" size="sm" onClick={() => leave(c.id)}>Leave</Button>}
                      </>
                    ) : c.request_status === "pending" ? (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => cancelRequest(c.id)}>
                        <Clock className="h-3.5 w-3.5" />Pending — cancel
                      </Button>
                    ) : (
                      <Button variant="hero" size="sm" className="flex-1" onClick={() => requestJoin(c.id)}>Request to join</Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Communities;
