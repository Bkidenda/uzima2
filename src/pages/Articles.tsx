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
import { FileText, PenLine } from "lucide-react";

const Articles = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts("article", user?.id).then((p) => { setPosts(p); setLoading(false); });
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Original writing"
          title="Articles on health, life, and faith."
          description="Longer reflections from contributors on Adventist health principles, lifestyle, and spiritual growth."
        />
        <section className="container py-8 lg:py-12">
          <div className="flex items-center justify-end mb-5">
            <Button asChild variant="hero" size="sm"><Link to="/compose?kind=article"><PenLine className="h-4 w-4" />Write an article</Link></Button>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : posts.length === 0 ? (
            <EmptyState icon={<FileText className="h-5 w-5" />} title="No articles yet" description="Share original writing on Adventist health, lifestyle, and spiritual growth." ctaTo="/compose?kind=article" ctaLabel="Write an article" />
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {posts.map((p) => <PostCard key={p.id} post={p} variant="row" />)}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Articles;
