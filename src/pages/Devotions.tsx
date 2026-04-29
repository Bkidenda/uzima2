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
import { BookOpen, PenLine } from "lucide-react";

const Devotions = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts("devotion", user?.id).then((p) => { setPosts(p); setLoading(false); });
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Daily encouragement"
          title="Devotions for body and spirit."
          description="Short, scripture-rooted reflections written by community members to nourish your walk with God."
        />
        <section className="container py-8 lg:py-12">
          <div className="flex items-center justify-end mb-5">
            <Button asChild variant="hero" size="sm"><Link to="/compose?kind=devotion"><PenLine className="h-4 w-4" />Share a devotion</Link></Button>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : posts.length === 0 ? (
            <EmptyState icon={<BookOpen className="h-5 w-5" />} title="No devotions yet" description="Share scripture-rooted encouragement with the community." ctaTo="/compose?kind=devotion" ctaLabel="Share a devotion" />
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

export default Devotions;
