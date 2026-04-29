import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PostRow } from "@/lib/posts";

interface Comment {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { username: string; display_name: string | null };
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostRow | null>(null);
  const [author, setAuthor] = useState<{ username: string; display_name: string | null } | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (!p) { setLoading(false); return; }
      setPost(p as PostRow);
      const [authorRes, likesRes, myLikeRes, commentsRes] = await Promise.all([
        supabase.from("profiles").select("username, display_name").eq("id", p.author_id).maybeSingle(),
        supabase.from("post_likes").select("post_id", { count: "exact", head: true }).eq("post_id", id),
        user ? supabase.from("post_likes").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("post_comments").select("id, author_id, body, created_at").eq("post_id", id).order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      setAuthor(authorRes.data ?? null);
      setLikes(likesRes.count ?? 0);
      setLiked(!!myLikeRes.data);
      const cs = (commentsRes.data ?? []) as Comment[];
      const authorIds = [...new Set(cs.map((c) => c.author_id))];
      if (authorIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, display_name").in("id", authorIds);
        const map = new Map((profs ?? []).map((p: any) => [p.id, { username: p.username, display_name: p.display_name }]));
        cs.forEach((c) => { c.author = map.get(c.author_id); });
      }
      setComments(cs);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  // Realtime comments
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`post-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${id}` }, async (payload) => {
        const c = payload.new as Comment;
        if (comments.some((x) => x.id === c.id)) return;
        const { data: prof } = await supabase.from("profiles").select("username, display_name").eq("id", c.author_id).maybeSingle();
        setComments((prev) => [...prev, { ...c, author: prof ?? undefined }]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "post_comments", filter: `post_id=eq.${id}` }, (payload) => {
        setComments((prev) => prev.filter((c) => c.id !== (payload.old as any).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, comments]);

  const handleLike = async () => {
    if (!user) { toast({ title: "Sign in to react" }); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((n) => n + (wasLiked ? -1 : 1));
    const { error } = wasLiked
      ? await supabase.from("post_likes").delete().eq("post_id", id!).eq("user_id", user.id)
      : await supabase.from("post_likes").insert({ post_id: id!, user_id: user.id });
    if (error) { setLiked(wasLiked); setLikes((n) => n + (wasLiked ? 1 : -1)); }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth"); return; }
    if (!newComment.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("post_comments").insert({ post_id: id!, author_id: user.id, body: newComment.trim() });
    if (error) toast({ title: "Couldn't post comment", variant: "destructive" });
    else setNewComment("");
    setPosting(false);
  };

  const deleteComment = async (cid: string) => {
    await supabase.from("post_comments").delete().eq("id", cid);
  };

  const deletePost = async () => {
    if (!post || !user || post.author_id !== user.id) return;
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", post.id);
    navigate(`/${post.kind}s`);
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!post) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-20 text-center">
        <h1 className="font-serif text-3xl text-primary">Post not found</h1>
        <Button asChild variant="hero" className="mt-6"><Link to="/">Go home</Link></Button>
      </main>
      <Footer />
    </div>
  );

  const kindRoute = post.kind === "article" ? "/articles" : post.kind === "recipe" ? "/recipes" : "/devotions";
  const kindLabel = post.kind.charAt(0).toUpperCase() + post.kind.slice(1) + "s";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <article className="container py-8 lg:py-12 max-w-3xl">
          <Link to={kindRoute} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to {kindLabel}
          </Link>
          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.title} className="w-full h-64 lg:h-80 object-cover rounded-2xl mb-6" />
          )}
          <p className="text-[11px] uppercase tracking-wider text-accent font-medium">{post.category || post.kind}</p>
          <h1 className="mt-1 font-serif text-3xl lg:text-4xl text-primary leading-tight">{post.title}</h1>
          <div className="mt-3 flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>by <Link to={`/u/${author?.username || ""}`} className="hover:underline text-primary">@{author?.username || "member"}</Link>{post.read_time && <> · {post.read_time}</>}</span>
            {user?.id === post.author_id && (
              <Button variant="ghost" size="sm" onClick={deletePost}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>

          {post.verse && (
            <p className="mt-6 font-serif italic text-accent border-l-2 border-accent pl-4">{post.verse}</p>
          )}

          {post.excerpt && <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>}

          {post.kind === "recipe" && (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {post.ingredients && post.ingredients.length > 0 && (
                <div>
                  <h2 className="font-serif text-xl text-primary mb-3">Ingredients</h2>
                  <ul className="space-y-1.5 text-sm">
                    {post.ingredients.map((i, idx) => <li key={idx} className="flex gap-2"><span className="text-accent">•</span>{i}</li>)}
                  </ul>
                </div>
              )}
              {post.steps && post.steps.length > 0 && (
                <div>
                  <h2 className="font-serif text-xl text-primary mb-3">{(post as any).steps_label || "Steps"}</h2>
                  <ol className="space-y-2 text-sm">
                    {post.steps.map((s, idx) => <li key={idx} className="flex gap-2"><span className="text-accent font-medium">{idx + 1}.</span>{s}</li>)}
                  </ol>
                </div>
              )}
            </div>
          )}

          {post.kind === "recipe" && (post as any).serving_suggestions && (
            <div className="mt-6 rounded-xl bg-secondary/40 p-4">
              <p className="text-xs uppercase tracking-wider text-primary font-medium mb-1">Serving suggestions</p>
              <p className="text-sm whitespace-pre-wrap">{(post as any).serving_suggestions}</p>
            </div>
          )}

          {post.body && (
            post.body.trim().startsWith("<")
              ? <div className="mt-8 prose prose-sm max-w-none text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: post.body }} />
              : <div className="mt-8 prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed">{post.body}</div>
          )}

          {post.kind === "recipe" && post.health_note && (
            <div className="mt-6 rounded-xl bg-secondary/60 p-4">
              <p className="text-xs uppercase tracking-wider text-primary font-medium mb-1">My tips</p>
              <p className="text-sm">{post.health_note}</p>
            </div>
          )}

          {post.kind !== "recipe" && post.health_note && (
            <div className="mt-6 rounded-xl bg-secondary/60 p-4 text-sm"><span className="font-medium text-primary">Health benefit: </span>{post.health_note}</div>
          )}
          {post.faith_reflection && (
            <div className="mt-3 rounded-xl bg-gradient-verse p-4 text-sm font-serif italic">{post.faith_reflection}</div>
          )}
          {post.takeaway && (
            <div className="mt-6 rounded-xl bg-secondary/60 p-4">
              <p className="text-xs uppercase tracking-wider text-primary font-medium mb-1">Takeaway</p>
              <p className="text-sm">{post.takeaway}</p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 border-y border-border/60 py-4">
            <Button variant={liked ? "accent" : "ghost"} size="sm" onClick={handleLike}>
              <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} /> {likes} {likes === 1 ? "like" : "likes"}
            </Button>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground ml-2">
              <MessageCircle className="h-4 w-4" /> {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </span>
          </div>

          <section className="mt-6">
            <h2 className="font-serif text-xl text-primary mb-3">Conversation</h2>
            <form onSubmit={submitComment} className="space-y-2 mb-6">
              <Textarea value={newComment} maxLength={1000} onChange={(e) => setNewComment(e.target.value)} placeholder={user ? "Share an encouragement…" : "Sign in to comment"} disabled={!user || posting} rows={3} />
              <div className="flex justify-end">
                <Button type="submit" variant="hero" size="sm" disabled={!user || posting || !newComment.trim()}>
                  {posting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Post comment
                </Button>
              </div>
            </form>

            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Be the first to encourage @{author?.username}.</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-xl bg-card p-4 ring-1 ring-border/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                          {(c.author?.username ?? "U").charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-primary">@{c.author?.username || "member"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      {user?.id === c.author_id && (
                        <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PostDetail;
