import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageCircle, Users, Search, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ConvSummary {
  id: string;
  kind: "direct" | "group";
  title: string | null;
  community_id: string | null;
  community_name?: string | null;
  other_username?: string | null;
  other_full_name?: string | null;
  last_body?: string | null;
  last_at?: string | null;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<ConvSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; username: string; display_name: string | null; full_name: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { if (!authLoading && !user) navigate("/auth", { replace: true }); }, [authLoading, user, navigate]);

  const loadConvs = async () => {
    if (!user) return;
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);
    const partIds = (parts ?? []).map((p) => p.conversation_id);

    const { data: communityMems } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);
    const communityIds = (communityMems ?? []).map((m) => m.community_id);

    let convQuery = supabase.from("conversations").select("id, kind, title, community_id");
    if (partIds.length && communityIds.length) {
      convQuery = convQuery.or(`id.in.(${partIds.join(",")}),community_id.in.(${communityIds.join(",")})`);
    } else if (partIds.length) {
      convQuery = convQuery.in("id", partIds);
    } else if (communityIds.length) {
      convQuery = convQuery.in("community_id", communityIds);
    } else {
      setConvs([]); setLoading(false); return;
    }
    const { data: cs } = await convQuery;
    const summaries: ConvSummary[] = (cs ?? []) as any;

    const directIds = summaries.filter((c) => c.kind === "direct").map((c) => c.id);
    const commIds = summaries.filter((c) => c.community_id).map((c) => c.community_id!);
    const allIds = summaries.map((c) => c.id);

    const [otherPartsRes, commsRes, lastMsgsRes] = await Promise.all([
      directIds.length
        ? supabase.from("conversation_participants").select("conversation_id, user_id").in("conversation_id", directIds).neq("user_id", user.id)
        : Promise.resolve({ data: [] as any[] }),
      commIds.length ? supabase.from("communities").select("id, name").in("id", commIds) : Promise.resolve({ data: [] as any[] }),
      allIds.length ? supabase.from("messages").select("conversation_id, body, created_at").in("conversation_id", allIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    ]);
    const otherUserIds = [...new Set((otherPartsRes.data ?? []).map((p: any) => p.user_id))];
    const { data: profs } = otherUserIds.length
      ? await supabase.from("profiles").select("id, username, full_name, display_name").in("id", otherUserIds)
      : { data: [] as any[] };
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const otherByConv = new Map<string, any>();
    (otherPartsRes.data ?? []).forEach((p: any) => { otherByConv.set(p.conversation_id, profMap.get(p.user_id) ?? null); });
    const commMap = new Map((commsRes.data ?? []).map((c: any) => [c.id, c.name]));
    const lastByConv = new Map<string, { body: string; created_at: string }>();
    (lastMsgsRes.data ?? []).forEach((m: any) => { if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m); });

    const enriched = summaries.map((c) => {
      const op = c.kind === "direct" ? otherByConv.get(c.id) : null;
      return {
        ...c,
        other_username: op?.username ?? null,
        other_full_name: op?.full_name ?? op?.display_name ?? null,
        community_name: c.community_id ? commMap.get(c.community_id) ?? null : null,
        last_body: lastByConv.get(c.id)?.body ?? null,
        last_at: lastByConv.get(c.id)?.created_at ?? null,
      };
    });
    enriched.sort((a, b) => (b.last_at ?? "").localeCompare(a.last_at ?? ""));
    setConvs(enriched);
    setLoading(false);
  };

  useEffect(() => { if (user) loadConvs(); /* eslint-disable-next-line */ }, [user?.id]);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim() || !user) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, full_name")
      .or(`username.ilike.%${q.trim()}%,display_name.ilike.%${q.trim()}%,full_name.ilike.%${q.trim()}%`)
      .neq("id", user.id)
      .limit(8);
    setResults((data ?? []) as any);
    setSearching(false);
  };

  const startDM = async (otherId: string) => {
    if (!user) return;
    const { data, error } = await (supabase as any).rpc("get_or_create_dm", { _other_user_id: otherId });
    if (error || !data) {
      toast({ title: "Couldn't start chat", description: error?.message, variant: "destructive" });
      return;
    }
    navigate(`/messages/${data as string}`);
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  const personal = convs.filter((c) => c.kind === "direct");
  const community = convs.filter((c) => c.kind === "group");

  const renderEmpty = (label: string, hint: string, ctaHref: string, ctaLabel: string) => (
    <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border/60">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><MessageCircle className="h-5 w-5" /></div>
      <h3 className="mt-4 font-serif text-xl text-primary">{label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <Button asChild variant="hero" size="sm" className="mt-5"><Link to={ctaHref}>{ctaLabel}</Link></Button>
    </div>
  );

  const renderList = (list: ConvSummary[]) => (
    <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/60 overflow-hidden">
      {list.map((c) => (
        <li key={c.id}>
          <Link to={`/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-secondary/40 transition-smooth">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary shrink-0">
              {c.kind === "group" ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary truncate">
                {c.kind === "group"
                  ? (c.community_name ?? c.title ?? "Group")
                  : (c.other_full_name ?? `@${c.other_username ?? "member"}`)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {c.last_body ?? (c.kind === "group" ? "Community chatroom" : "Say hello…")}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader eyebrow="Stay in touch" title="Chats" description="Direct chats with members and community chatrooms — separated for clarity." />
        <section className="container py-8 lg:py-12 max-w-3xl">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60 mb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <div className="relative flex-1 min-w-[12rem]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Find a member by name or username…" className="pl-9" />
              </div>
              <Button asChild variant="ghost" size="sm"><Link to="/members">Browse members</Link></Button>
            </div>
            {search.trim() && (
              <ul className="mt-2 divide-y divide-border/60">
                {searching && <li className="py-2 text-sm text-muted-foreground">Searching…</li>}
                {!searching && results.length === 0 && <li className="py-2 text-sm text-muted-foreground">No members found.</li>}
                {results.map((r) => (
                  <li key={r.id} className="py-2 flex items-center justify-between">
                    <Link to={`/u/${r.username}`} className="text-sm hover:underline">
                      {r.full_name ?? r.display_name ?? `@${r.username}`}
                      <span className="text-muted-foreground"> · @{r.username}</span>
                    </Link>
                    <Button size="sm" variant="hero" onClick={() => startDM(r.id)}>Message</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="personal">Personal ({personal.length})</TabsTrigger>
              <TabsTrigger value="community">Communities ({community.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="mt-5">
              {loading ? <p className="text-muted-foreground text-sm">Loading…</p>
                : personal.length === 0
                ? renderEmpty("No personal chats yet", "Find a member to start a 1:1 conversation.", "/members", "Browse members")
                : renderList(personal)}
            </TabsContent>
            <TabsContent value="community" className="mt-5">
              {loading ? <p className="text-muted-foreground text-sm">Loading…</p>
                : community.length === 0
                ? renderEmpty("No community chats yet", "Join or create a community to chat with the group.", "/communities", "Browse communities")
                : renderList(community)}
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
