import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Heart, MessageCircle, UserPlus, Megaphone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const iconFor = (t: string) => {
  switch (t) {
    case "post_like": return <Heart className="h-4 w-4 text-accent" />;
    case "post_comment": return <MessageCircle className="h-4 w-4 text-primary" />;
    case "follow": return <UserPlus className="h-4 w-4 text-primary" />;
    case "announcement": return <Megaphone className="h-4 w-4 text-accent" />;
    case "new_message": return <MessageCircle className="h-4 w-4 text-primary" />;
    case "new_post_from_following": return <FileText className="h-4 w-4 text-primary" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

const NotificationsBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("notifications")
      .select("id, type, title, body, link, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15);
    setItems((data ?? []) as Notif[]);
    setUnread(((data ?? []) as Notif[]).filter((n) => !n.read).length);
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user?.id]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        const n = payload.new as Notif;
        setItems((prev) => [n, ...prev].slice(0, 15));
        setUnread((c) => c + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAllRead = async () => {
    if (!user) return;
    await (supabase as any).from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleClick = async (n: Notif) => {
    if (!n.read) {
      await (supabase as any).from("notifications").update({ read: true }).eq("id", n.id);
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-secondary text-primary transition-smooth"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 px-1 place-items-center rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
          <p className="font-serif text-sm text-primary">Notifications</p>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[11px] text-accent hover:underline inline-flex items-center gap-1">
              <CheckCheck className="h-3 w-3" />Mark all read
            </button>
          )}
        </div>
        <ul className="max-h-96 overflow-y-auto divide-y divide-border/60">
          {items.length === 0 && (
            <li className="p-6 text-center text-xs text-muted-foreground">You're all caught up.</li>
          )}
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => handleClick(n)}
                className={`w-full text-left flex gap-2 px-3 py-2.5 hover:bg-secondary/50 transition-smooth ${!n.read ? "bg-secondary/30" : ""}`}
              >
                <span className="mt-0.5">{iconFor(n.type)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-primary truncate">{n.title}</span>
                  {n.body && <span className="block text-[11px] text-muted-foreground line-clamp-2">{n.body}</span>}
                  <span className="block text-[10px] text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </span>
                {!n.read && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-border/60 p-2 text-center">
          <Button asChild variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
            <Link to="/notifications">View all</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
