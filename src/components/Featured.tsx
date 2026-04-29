import { Heart, MessageCircle, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedItem {
  id: string;
  kind: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  like_count: number;
  comment_count: number;
}

const tagFor = (kind: string) =>
  kind === "recipe" ? "Top Recipe" : kind === "devotion" ? "Top Devotion" : "Top Article";
const accentFor = (kind: string) =>
  kind === "recipe" ? "from-accent/20 to-accent/5"
    : kind === "devotion" ? "from-primary/20 to-primary/5"
    : "from-gold/25 to-gold/5";

const Featured = () => {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: posts } = await supabase
        .from("posts")
        .select("id, kind, title, excerpt, cover_image_url, author_id, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      const list = (posts ?? []) as any[];
      if (!list.length) { setItems([]); setLoading(false); return; }
      const ids = list.map((p) => p.id);
      const authorIds = [...new Set(list.map((p) => p.author_id))];
      const [likesRes, commentsRes, profsRes] = await Promise.all([
        supabase.from("post_likes").select("post_id").in("post_id", ids),
        supabase.from("post_comments").select("post_id").in("post_id", ids),
        supabase.from("profiles").select("id, username, display_name, full_name").in("id", authorIds),
      ]);
      const likeMap = new Map<string, number>();
      (likesRes.data ?? []).forEach((r: any) => likeMap.set(r.post_id, (likeMap.get(r.post_id) ?? 0) + 1));
      const commentMap = new Map<string, number>();
      (commentsRes.data ?? []).forEach((r: any) => commentMap.set(r.post_id, (commentMap.get(r.post_id) ?? 0) + 1));
      const profMap = new Map((profsRes.data ?? []).map((p: any) => [p.id, p]));
      const enriched: FeaturedItem[] = list.map((p) => ({
        id: p.id, kind: p.kind, title: p.title, excerpt: p.excerpt, cover_image_url: p.cover_image_url,
        author_name: (() => { const a: any = profMap.get(p.author_id); return a?.display_name || a?.full_name || (a ? `@${a.username}` : "member"); })(),
        like_count: likeMap.get(p.id) ?? 0,
        comment_count: commentMap.get(p.id) ?? 0,
      }));
      enriched.sort((a, b) => b.like_count - a.like_count || b.comment_count - a.comment_count);
      setItems(enriched.slice(0, 3));
      setLoading(false);
    })();
  }, []);

  return (
    <section className="py-12 lg:py-16 bg-gradient-warm">
      <div className="container">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-accent font-medium">This week in Uzima</p>
            <h2 className="mt-2 font-serif text-3xl lg:text-4xl text-primary text-balance">
              Featured contributions.
            </h2>
          </div>
          <Link to="/articles" className="text-sm font-medium text-primary hover:text-accent transition-smooth">
            See all featured →
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No contributions yet — be the first to share!</p>
        ) : (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {items.map((f, i) => (
              <Link
                key={f.id}
                to={`/posts/${f.id}`}
                style={{ animationDelay: `${i * 100}ms` }}
                className="group flex flex-col rounded-2xl bg-card overflow-hidden shadow-card ring-1 ring-border/60 transition-smooth hover:-translate-y-1 hover:shadow-warm animate-fade-up"
              >
                <div className={`relative h-32 bg-gradient-to-br ${accentFor(f.kind)} flex items-center justify-center overflow-hidden`}>
                  {f.cover_image_url ? (
                    <img src={f.cover_image_url} alt={f.title} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <Award className="h-12 w-12 text-primary/40" strokeWidth={1.2} />
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-card/90 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-primary">
                    {tagFor(f.kind)}
                  </span>
                </div>
                <div className="flex-1 p-5 flex flex-col">
                  <h3 className="font-serif text-xl text-primary leading-snug">{f.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">by {f.author_name}</p>
                  {f.excerpt && <p className="mt-2 text-sm leading-relaxed text-muted-foreground flex-1 line-clamp-3">{f.excerpt}</p>}
                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center gap-5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4" /> {f.like_count}</span>
                    <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {f.comment_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Featured;
