import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, UserPlus, UserCheck, Loader2 } from "lucide-react";
import PostCard from "@/components/PostCard";
import type { PostWithMeta } from "@/lib/posts";

interface Prof {
  id: string;
  username: string;
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  favorite_verse: string | null;
  created_at: string;
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prof, setProf] = useState<Prof | null>(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [iFollow, setIFollow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [startingDM, setStartingDM] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase.from("profiles")
        .select("id, username, display_name, full_name, bio, avatar_url, favorite_verse, created_at")
        .eq("username", username).maybeSingle();
      if (cancelled) return;
      if (!p) { setLoading(false); setProf(null); return; }
      setProf(p as Prof);

      const [followersRes, followingRes, mineRes, postsRes] = await Promise.all([
        (supabase as any).from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", p.id),
        (supabase as any).from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", p.id),
        user ? (supabase as any).from("follows").select("follower_id").eq("follower_id", user.id).eq("followee_id", p.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("posts").select("*").eq("author_id", p.id).order("created_at", { ascending: false }).limit(12),
      ]);
      if (cancelled) return;
      setFollowers(followersRes.count ?? 0);
      setFollowing(followingRes.count ?? 0);
      setIFollow(!!mineRes.data);

      const ps = (postsRes.data ?? []) as any[];
      const ids = ps.map((x) => x.id);
      let likeMap = new Map<string, number>(), commentMap = new Map<string, number>(), myLikes = new Set<string>();
      if (ids.length) {
        const [lk, cm, mine] = await Promise.all([
          supabase.from("post_likes").select("post_id").in("post_id", ids),
          supabase.from("post_comments").select("post_id").in("post_id", ids),
          user ? supabase.from("post_likes").select("post_id").in("post_id", ids).eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
        ]);
        (lk.data ?? []).forEach((r: any) => likeMap.set(r.post_id, (likeMap.get(r.post_id) ?? 0) + 1));
        (cm.data ?? []).forEach((r: any) => commentMap.set(r.post_id, (commentMap.get(r.post_id) ?? 0) + 1));
        (mine.data ?? []).forEach((r: any) => myLikes.add(r.post_id));
      }
      setPosts(ps.map((x) => ({
        ...x,
        author_username: p.username,
        author_display_name: p.display_name,
        like_count: likeMap.get(x.id) ?? 0,
        comment_count: commentMap.get(x.id) ?? 0,
        liked_by_me: myLikes.has(x.id),
      })));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [username, user?.id]);

  const toggleFollow = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!prof || prof.id === user.id) return;
    setBusy(true);
    if (iFollow) {
      const { error } = await (supabase as any).from("follows").delete().eq("follower_id", user.id).eq("followee_id", prof.id);
      if (!error) { setIFollow(false); setFollowers((n) => Math.max(0, n - 1)); }
    } else {
      const { error } = await (supabase as any).from("follows").insert({ follower_id: user.id, followee_id: prof.id });
      if (!error) { setIFollow(true); setFollowers((n) => n + 1); toast({ title: `Following @${prof.username}` }); }
    }
    setBusy(false);
  };

  const startDM = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!prof || prof.id === user.id) return;
    setStartingDM(true);
    const { data, error } = await (supabase as any).rpc("get_or_create_dm", { _other_user_id: prof.id });
    setStartingDM(false);
    if (error || !data) { toast({ title: "Couldn't start chat", description: error?.message, variant: "destructive" }); return; }
    navigate(`/messages/${data}`);
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!prof) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-20 text-center">
        <h1 className="font-serif text-3xl text-primary">User not found</h1>
        <Button asChild variant="hero" className="mt-6"><Link to="/">Go home</Link></Button>
      </main>
      <Footer />
    </div>
  );

  const isMe = user?.id === prof.id;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8 lg:py-12 max-w-4xl">
        <div className="rounded-2xl bg-gradient-warm p-6 lg:p-8 ring-1 ring-border/60">
          <div className="flex items-start gap-5 flex-wrap">
            <span className="grid h-20 w-20 rounded-full bg-card text-primary place-items-center overflow-hidden ring-2 ring-border shrink-0">
              {prof.avatar_url
                ? <img src={prof.avatar_url} alt={`@${prof.username}`} className="h-full w-full object-cover" />
                : <span className="font-serif text-3xl">{prof.username.charAt(0).toUpperCase()}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-3xl text-primary">@{prof.username}</h1>
              {(prof.display_name || prof.full_name) && (
                <p className="text-sm text-muted-foreground">{prof.display_name || prof.full_name}</p>
              )}
              {prof.bio && <p className="mt-3 text-sm text-foreground/80 max-w-xl">{prof.bio}</p>}
              {prof.favorite_verse && (
                <p className="mt-3 font-serif italic text-accent border-l-2 border-accent pl-3 max-w-xl text-sm">{prof.favorite_verse}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span><span className="text-primary font-semibold">{followers}</span> follower{followers === 1 ? "" : "s"}</span>
                <span><span className="text-primary font-semibold">{following}</span> following</span>
              </div>
            </div>
            {!isMe && (
              <div className="flex items-center gap-2">
                <Button variant={iFollow ? "outline" : "hero"} onClick={toggleFollow} disabled={busy}>
                  {iFollow ? <><UserCheck className="h-4 w-4" />Following</> : <><UserPlus className="h-4 w-4" />Follow</>}
                </Button>
                <Button variant="outline" onClick={startDM} disabled={startingDM}>
                  {startingDM ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Message
                </Button>
              </div>
            )}
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-serif text-xl text-primary mb-4">Posts</h2>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No posts yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
