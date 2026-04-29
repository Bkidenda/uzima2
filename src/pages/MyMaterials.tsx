import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, FileEdit, Plus } from "lucide-react";

interface MyPost { id: string; title: string; kind: string; created_at: string; cover_image_url: string | null; }

const MyMaterials = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [loading, user, navigate]);

  const load = async () => {
    if (!user) return;
    setBusy(true);
    const { data } = await supabase
      .from("posts")
      .select("id, title, kind, created_at, cover_image_url")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });
    setPosts((data ?? []) as MyPost[]);
    setBusy(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user?.id]);

  const remove = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); load(); }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  const grouped: Record<string, MyPost[]> = { article: [], recipe: [], devotion: [] };
  posts.forEach((p) => { (grouped[p.kind] ??= []).push(p); });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader eyebrow="Your contributions" title="My materials" description="Edit or remove anything you've shared with the community." />
        <section className="container py-8 lg:py-12 max-w-3xl">
          <div className="flex items-center justify-end mb-6 gap-2">
            <Button asChild variant="hero" size="sm"><Link to="/compose"><Plus className="h-4 w-4" />New post</Link></Button>
          </div>

          {busy ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border/60">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><FileEdit className="h-5 w-5" /></div>
              <h3 className="mt-4 font-serif text-xl text-primary">Nothing to edit yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Share something with the community to see it here.</p>
              <Button asChild variant="hero" size="sm" className="mt-5"><Link to="/compose">Create your first post</Link></Button>
            </div>
          ) : (
            <div className="space-y-8">
              {(["article", "recipe", "devotion"] as const).map((kind) => grouped[kind] && grouped[kind].length > 0 && (
                <div key={kind}>
                  <h2 className="font-serif text-lg text-primary mb-3 capitalize">{kind}s <span className="text-sm text-muted-foreground">({grouped[kind].length})</span></h2>
                  <ul className="divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-border/60 overflow-hidden">
                    {grouped[kind].map((p) => (
                      <li key={p.id} className="flex items-center gap-3 p-4">
                        {p.cover_image_url ? (
                          <img src={p.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gradient-warm grid place-items-center shrink-0 text-primary font-serif">{p.kind[0].toUpperCase()}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link to={`/posts/${p.id}`} className="font-medium text-primary hover:underline truncate block">{p.title}</Link>
                          <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button asChild variant="ghost" size="sm"><Link to={`/edit/${p.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                          <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default MyMaterials;
