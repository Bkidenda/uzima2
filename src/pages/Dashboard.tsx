import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChefHat, BookOpen, Video, FileText, PenLine, Sparkles, Users, MessageCircle } from "lucide-react";

const tiles = [
  { to: "/recipes", icon: ChefHat, label: "Recipes", desc: "Browse plant-based meals" },
  { to: "/devotions", icon: BookOpen, label: "Devotions", desc: "Daily reflections" },
  { to: "/videos", icon: Video, label: "Videos", desc: "Cooking & devotional clips" },
  { to: "/articles", icon: FileText, label: "Articles", desc: "Longer reads" },
  { to: "/communities", icon: Users, label: "Communities", desc: "Find your people" },
  { to: "/messages", icon: MessageCircle, label: "Messages", desc: "Chats & chatrooms" },
];

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const name = profile?.display_name || profile?.username || "friend";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-warm border-b border-border/50">
          <div className="container py-10 lg:py-14">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <Sparkles className="h-3 w-3 text-accent" />
                  Welcome back
                </span>
                <h1 className="mt-3 font-serif text-4xl lg:text-5xl text-primary text-balance">
                  Shalom, {name}.
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Signed in as <span className="text-primary font-medium">@{profile?.username}</span> · {user.email}
                </p>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-card px-5 py-4 shadow-card ring-1 ring-border/60">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-serif text-xl">
                  {(profile?.username ?? "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-serif text-lg text-primary">@{profile?.username}</p>
                  <p className="text-xs text-muted-foreground">Uzima member</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-10 lg:py-14">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
            <h2 className="font-serif text-2xl text-primary">Where would you like to go?</h2>
            <Button variant="hero" size="sm" asChild>
              <Link to="/compose">
                <PenLine className="h-4 w-4" />
                Share something
              </Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiles.map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="group rounded-2xl bg-card p-5 shadow-card ring-1 ring-border/60 transition-smooth hover:-translate-y-1 hover:shadow-warm"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-serif text-xl text-primary">{label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-gradient-verse p-6 lg:p-8 ring-1 ring-border/50">
            <p className="font-serif text-lg lg:text-xl text-primary italic leading-snug">
              "Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth."
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-accent font-medium">3 John 1:2</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
