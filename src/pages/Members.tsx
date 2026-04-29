import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, UserPlus, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MemberRow {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const Members = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate("/auth", { replace: true }); }, [authLoading, user, navigate]);

  const load = async (search = "") => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from("profiles").select("id, username, display_name, avatar_url, bio").neq("id", user.id).limit(60);
    if (search.trim()) query = query.or(`username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`);
    const [{ data }, follows] = await Promise.all([
      query,
      (supabase as any).from("follows").select("followee_id").eq("follower_id", user.id),
    ]);
    setRows((data ?? []) as MemberRow[]);
    setFollowingSet(new Set(((follows.data ?? []) as any[]).map((f) => f.followee_id)));
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user?.id]);

  const onSearch = (v: string) => {
    setQ(v);
    load(v);
  };

  const toggleFollow = async (id: string) => {
    if (!user) return;
    if (followingSet.has(id)) {
      await (supabase as any).from("follows").delete().eq("follower_id", user.id).eq("followee_id", id);
      setFollowingSet((s) => { const n = new Set(s); n.delete(id); return n; });
    } else {
      const { error } = await (supabase as any).from("follows").insert({ follower_id: user.id, followee_id: id });
      if (!error) setFollowingSet((s) => new Set(s).add(id));
    }
  };

  const startDM = async (id: string) => {
    const { data, error } = await (supabase as any).rpc("get_or_create_dm", { _other_user_id: id });
    if (error || !data) { toast({ title: "Couldn't start chat", description: error?.message, variant: "destructive" }); return; }
    navigate(`/messages/${data}`);
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader eyebrow="People" title="Discover members" description="Find and follow others, then strike up a conversation." />
        <section className="container py-8 lg:py-12 max-w-4xl">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Search by username or name…" className="pl-9" />
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {rows.map((m) => (
                <li key={m.id} className="rounded-2xl bg-card p-4 ring-1 ring-border/60 flex items-center gap-3">
                  <Link to={`/u/${m.username}`} className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary overflow-hidden shrink-0">
                    {m.avatar_url ? <img src={m.avatar_url} alt={m.username} className="h-full w-full object-cover" /> : (m.username.charAt(0).toUpperCase())}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/u/${m.username}`} className="block font-medium text-primary truncate hover:underline">@{m.username}</Link>
                    {m.display_name && <p className="text-xs text-muted-foreground truncate">{m.display_name}</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant={followingSet.has(m.id) ? "outline" : "hero"} onClick={() => toggleFollow(m.id)}>
                      {followingSet.has(m.id) ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startDM(m.id)}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Members;
