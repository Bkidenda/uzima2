import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Users, MessageCircle, Loader2, Reply, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  parent_message_id: string | null;
  created_at: string;
  sender?: { username: string; display_name: string | null; full_name: string | null };
}

const ChatRoom = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState<any>(null);
  const [title, setTitle] = useState("Chat");
  const [isGroup, setIsGroup] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const profileCacheRef = useRef<Map<string, { username: string; display_name: string | null; full_name: string | null }>>(new Map());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const swipeStartX = useRef<{ id: string; x: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<{ id: string; dx: number } | null>(null);

  useEffect(() => { if (!authLoading && !user) navigate("/auth", { replace: true }); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      const { data: c } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
      if (cancelled || !c) { setLoading(false); return; }
      setConv(c);
      setIsGroup(c.kind === "group");

      if (c.kind === "group" && c.community_id) {
        const { data: comm } = await supabase.from("communities").select("name").eq("id", c.community_id).maybeSingle();
        setTitle(comm?.name ?? c.title ?? "Group");
      } else {
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", id)
          .neq("user_id", user.id);
        const otherId = parts?.[0]?.user_id;
        if (otherId) {
          const { data: prof } = await supabase.from("profiles").select("username, full_name, display_name").eq("id", otherId).maybeSingle();
          setTitle(prof?.full_name ?? prof?.display_name ?? `@${prof?.username ?? "member"}`);
        }
      }

      const { data: msgs } = await supabase
        .from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }).limit(200);
      const list = (msgs ?? []) as Message[];
      const senderIds = [...new Set(list.map((m) => m.sender_id))];
      if (senderIds.length) {
        const { data: profs } = await supabase.from("profiles").select("id, username, display_name, full_name").in("id", senderIds);
        (profs ?? []).forEach((p: any) => profileCacheRef.current.set(p.id, p));
        list.forEach((m) => { m.sender = profileCacheRef.current.get(m.sender_id); });
      }
      setMessages(list);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` }, async (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        if (!profileCacheRef.current.has(m.sender_id)) {
          const { data: prof } = await supabase.from("profiles").select("username, display_name, full_name").eq("id", m.sender_id).maybeSingle();
          if (prof) {
            profileCacheRef.current.set(m.sender_id, prof);
            setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, sender: prof } : x));
          }
        } else {
          setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, sender: profileCacheRef.current.get(m.sender_id) } : x));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !body.trim() || sending) return;
    setSending(true);
    const text = body.trim().slice(0, 2000);
    const parent_message_id = replyTo?.id ?? null;
    setBody("");
    setReplyTo(null);
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: user.id, body: text, parent_message_id } as any);
    if (error) { toast({ title: "Couldn't send", description: error.message, variant: "destructive" }); setBody(text); }
    setSending(false);
  };

  const startReply = (m: Message) => {
    setReplyTo(m);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const findMsg = (mid: string | null) => mid ? messages.find((x) => x.id === mid) : null;

  // Swipe handlers (mobile)
  const onTouchStart = (e: React.TouchEvent, m: Message) => {
    swipeStartX.current = { id: m.id, x: e.touches[0].clientX };
  };
  const onTouchMove = (e: React.TouchEvent, m: Message) => {
    if (!swipeStartX.current || swipeStartX.current.id !== m.id) return;
    const dx = e.touches[0].clientX - swipeStartX.current.x;
    if (dx > 0 && dx < 120) setSwipeOffset({ id: m.id, dx });
  };
  const onTouchEnd = (m: Message) => {
    if (swipeOffset && swipeOffset.id === m.id && swipeOffset.dx > 60) {
      startReply(m);
    }
    setSwipeOffset(null);
    swipeStartX.current = null;
  };

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container py-6 lg:py-8 max-w-3xl flex flex-col">
        <Link to="/messages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3">
          <ArrowLeft className="h-4 w-4" /> All chats
        </Link>
        <div className="flex items-center gap-3 rounded-t-2xl bg-card p-4 ring-1 ring-border/60">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
            {isGroup ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg text-primary truncate">{title}</p>
            <p className="text-xs text-muted-foreground">{isGroup ? "Community chatroom" : "Direct message"}</p>
          </div>
        </div>

        <div className="flex-1 min-h-[50vh] max-h-[60vh] overflow-y-auto bg-card ring-1 ring-border/60 border-t-0 p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground italic py-10">No messages yet — say hello!</p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            const parent = findMsg(m.parent_message_id);
            const dx = swipeOffset?.id === m.id ? swipeOffset.dx : 0;
            return (
              <div key={m.id} className={`group flex items-end gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <button
                    onClick={() => startReply(m)}
                    className="hidden md:inline-flex opacity-0 group-hover:opacity-100 transition-smooth h-7 w-7 place-items-center text-muted-foreground hover:text-primary"
                    aria-label="Reply"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                  style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? undefined : "transform 0.2s" }}
                  onTouchStart={(e) => onTouchStart(e, m)}
                  onTouchMove={(e) => onTouchMove(e, m)}
                  onTouchEnd={() => onTouchEnd(m)}
                >
                  {!mine && isGroup && (
                    <Link to={`/u/${m.sender?.username ?? ""}`} className={`text-[11px] font-medium opacity-80 mb-0.5 hover:underline block`}>
                      @{m.sender?.username || "member"}
                    </Link>
                  )}
                  {parent && (
                    <div className={`mb-1.5 rounded-md px-2 py-1 text-[11px] border-l-2 ${mine ? "bg-primary-foreground/10 border-primary-foreground/40" : "bg-background/60 border-primary/40"}`}>
                      <p className="font-medium opacity-80">↪ @{parent.sender?.username || "member"}</p>
                      <p className="opacity-80 line-clamp-2">{parent.body}</p>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "opacity-70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                {mine && (
                  <button
                    onClick={() => startReply(m)}
                    className="hidden md:inline-flex opacity-0 group-hover:opacity-100 transition-smooth h-7 w-7 place-items-center text-muted-foreground hover:text-primary"
                    aria-label="Reply"
                  >
                    <Reply className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {replyTo && (
          <div className="bg-card ring-1 ring-border/60 border-t-0 px-3 py-2 flex items-center gap-2 text-xs">
            <Reply className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Replying to <span className="text-primary">@{replyTo.sender?.username || "member"}</span>:</span>
            <span className="truncate flex-1">{replyTo.body}</span>
            <button onClick={() => setReplyTo(null)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        <form onSubmit={send} className="flex gap-2 rounded-b-2xl bg-card p-3 ring-1 ring-border/60 border-t-0">
          <Input ref={inputRef} value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} placeholder={replyTo ? "Write a reply…" : "Write a message…"} />
          <Button type="submit" variant="hero" disabled={sending || !body.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="md:hidden text-[11px] text-muted-foreground text-center mt-2">Tip: swipe a message right to reply.</p>
      </main>
      <Footer />
    </div>
  );
};

export default ChatRoom;
