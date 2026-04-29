import { supabase } from "@/integrations/supabase/client";

export type PostKind = "article" | "recipe" | "devotion";

export interface PostRow {
  id: string;
  author_id: string;
  kind: PostKind;
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_image_url: string | null;
  category: string | null;
  read_time: string | null;
  ingredients: string[] | null;
  steps: string[] | null;
  health_note: string | null;
  faith_reflection: string | null;
  verse: string | null;
  takeaway: string | null;
  created_at: string;
}

export interface PostWithMeta extends PostRow {
  author_username: string | null;
  author_display_name: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export async function fetchPosts(kind: PostKind, currentUserId?: string): Promise<PostWithMeta[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("kind", kind)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  const ids = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [likesRes, commentsRes, profilesRes, myLikesRes] = await Promise.all([
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
    supabase.from("profiles").select("id, username, display_name").in("id", authorIds),
    currentUserId
      ? supabase.from("post_likes").select("post_id").in("post_id", ids).eq("user_id", currentUserId)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const likeCounts = new Map<string, number>();
  (likesRes.data ?? []).forEach((r: any) => likeCounts.set(r.post_id, (likeCounts.get(r.post_id) ?? 0) + 1));
  const commentCounts = new Map<string, number>();
  (commentsRes.data ?? []).forEach((r: any) => commentCounts.set(r.post_id, (commentCounts.get(r.post_id) ?? 0) + 1));
  const profMap = new Map<string, { username: string; display_name: string | null }>();
  (profilesRes.data ?? []).forEach((p: any) => profMap.set(p.id, { username: p.username, display_name: p.display_name }));
  const myLikes = new Set<string>((myLikesRes.data ?? []).map((r: any) => r.post_id));

  return posts.map((p: any) => ({
    ...p,
    author_username: profMap.get(p.author_id)?.username ?? null,
    author_display_name: profMap.get(p.author_id)?.display_name ?? null,
    like_count: likeCounts.get(p.id) ?? 0,
    comment_count: commentCounts.get(p.id) ?? 0,
    liked_by_me: myLikes.has(p.id),
  }));
}

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    return supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  }
  return supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
}
