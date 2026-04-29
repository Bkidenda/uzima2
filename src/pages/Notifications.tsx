import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate("/auth", { replace: true }); }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("notifications")
      .select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(100);
    setItems((data ?? []) as Notif[]);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user?.id]);

  const markAll = async () => {
    if (!user) return;
    await (supabase as any).from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const remove = async (id: string) => {
    await (supabase as any).from("notifications").delete().eq("id", id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const click = async (n: Notif) => {
    if (!n.read) {
      await (supabase as any).from("notifications").update({ read: true }).eq("id", n.id);
    }
    if (n.link) navigate(n.link);
  };

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader eyebrow="Inbox" title="Notifications" description="Stay up to date with likes, comments, follows and announcements." />
        <section className="container py-8 lg:py-12 max-w-2xl">
          <div className="flex justify-end mb-4">
            <Button variant="ghost" size="sm" onClick={markAll}><CheckCheck className="h-4 w-4" />Mark all read</Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border/60">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><Bell className="h-5 w-5" /></div>
              <h3 className="mt-4 font-serif text-xl text-primary">All caught up</h3>
              <p className="mt-1 text-sm text-muted-foreground">No new notifications yet.</p>
            </div>
          ) : (
            <ul className="rounded-2xl bg-card ring-1 ring-border/60 overflow-hidden divide-y divide-border/60">
              {items.map((n) => (
                <li key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.read ? "bg-secondary/30" : ""}`}>
                  <button onClick={() => click(n)} className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-primary">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                  </button>
                  <button onClick={() => remove(n.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
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

export default Notifications;
