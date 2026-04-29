import { Link } from "react-router-dom";
import { Heart, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toggleLike, type PostWithMeta } from "@/lib/posts";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface Props {
  post: PostWithMeta;
  variant?: "card" | "row";
}

const PostCard = ({ post, variant = "card" }: Props) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.like_count);
  const [busy, setBusy] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in to react", description: "Join Uzima to like posts." });
      return;
    }
    if (busy) return;
    setBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((n) => n + (wasLiked ? -1 : 1));
    const { error } = await toggleLike(post.id, user.id, wasLiked);
    if (error) {
      setLiked(wasLiked);
      setLikes((n) => n + (wasLiked ? 1 : -1));
      toast({ title: "Couldn't update like", variant: "destructive" });
    }
    setBusy(false);
  };

  const author = post.author_display_name || post.author_username || "member";
  const kindLabel = post.kind.charAt(0).toUpperCase() + post.kind.slice(1);

  if (variant === "row") {
    return (
      <Link
        to={`/posts/${post.id}`}
        className="group flex gap-4 rounded-2xl bg-card p-5 shadow-card ring-1 ring-border/60 transition-smooth hover:-translate-y-0.5 hover:shadow-warm"
      >
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt={post.title} loading="lazy" className="h-24 w-24 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="h-24 w-24 rounded-xl bg-gradient-warm grid place-items-center shrink-0">
            <span className="font-serif text-2xl text-primary/40">{kindLabel.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-accent font-medium">{post.category || kindLabel}</p>
          <h3 className="mt-0.5 font-serif text-lg text-primary leading-snug line-clamp-2">{post.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">by <Link to={`/u/${post.author_username}`} onClick={(e) => e.stopPropagation()} className="hover:underline hover:text-primary">@{post.author_username || "member"}</Link>{post.read_time && <> · <Clock className="inline h-3 w-3" /> {post.read_time}</>}</p>
          {post.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <button onClick={handleLike} className={`inline-flex items-center gap-1 ${liked ? "text-accent" : "hover:text-primary"} transition-smooth`}>
              <Heart className="h-3.5 w-3.5" fill={liked ? "currentColor" : "none"} /> {likes}
            </button>
            <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post.comment_count}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/posts/${post.id}`}
      className="group flex flex-col rounded-2xl bg-card overflow-hidden shadow-card ring-1 ring-border/60 transition-smooth hover:-translate-y-1 hover:shadow-warm"
    >
      {post.cover_image_url ? (
        <img src={post.cover_image_url} alt={post.title} loading="lazy" className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 bg-gradient-warm grid place-items-center">
          <span className="font-serif text-4xl text-primary/30">{kindLabel}</span>
        </div>
      )}
      <div className="flex-1 p-5 flex flex-col">
        <p className="text-[11px] uppercase tracking-wider text-accent font-medium">{post.category || kindLabel}</p>
        <h3 className="mt-1 font-serif text-xl text-primary leading-snug line-clamp-2">{post.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">by <Link to={`/u/${post.author_username}`} onClick={(e) => e.stopPropagation()} className="hover:underline hover:text-primary">@{post.author_username || "member"}</Link></p>
        {post.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>}
        <div className="mt-auto pt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <button onClick={handleLike} className={`inline-flex items-center gap-1.5 ${liked ? "text-accent" : "hover:text-primary"} transition-smooth`}>
            <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} /> {likes}
          </button>
          <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {post.comment_count}</span>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
