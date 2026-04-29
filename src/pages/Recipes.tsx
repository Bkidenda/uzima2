import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import PostCard from "@/components/PostCard";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { fetchPosts, type PostWithMeta } from "@/lib/posts";
import { useAuth } from "@/hooks/useAuth";
import { ChefHat, PenLine } from "lucide-react";

const Recipes = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts("recipe", user?.id).then((p) => { setPosts(p); setLoading(false); });
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Plant-based"
          title="Recipes from the community kitchen."
          description="Wholesome vegetarian meals contributed by Uzima members — each with a health note and a reflection from the Word."
        />
        <section className="container py-8 lg:py-12">
          <div className="flex items-center justify-end mb-5">
            <Button asChild variant="hero" size="sm"><Link to="/compose?kind=recipe"><PenLine className="h-4 w-4" />Share a recipe</Link></Button>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : posts.length === 0 ? (
            <EmptyState icon={<ChefHat className="h-5 w-5" />} title="No recipes yet" description="Be the first to share a wholesome plant-based meal with the community." ctaTo="/compose?kind=recipe" ctaLabel="Share a recipe" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Recipes;
