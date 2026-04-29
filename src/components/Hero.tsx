import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-uzima.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="container grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-14 items-center pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1 text-xs font-medium text-secondary-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            A faith-centered community
          </span>
          <h1 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.05] text-primary text-balance">
            Nourish your body.<br />
            <span className="italic text-accent">Grow</span> your spirit.<br />
            Share your journey.
          </h1>
          <p className="mt-4 max-w-xl text-base lg:text-lg text-muted-foreground leading-relaxed">
            A welcoming space where health, food, and God's word come together.
            Share recipes, devotions, and reflections that nourish the whole person.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                Join Uzima
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/recipes">Explore the community</Link>
            </Button>
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-6 max-w-md">
            {[
              { v: "1.2k+", l: "Recipes shared" },
              { v: "480", l: "Devotions" },
              { v: "92", l: "Contributors" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-serif text-2xl lg:text-3xl text-primary">{s.v}</dt>
                <dd className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-fade-in">
          <div className="absolute -inset-4 bg-gradient-hero opacity-10 blur-3xl rounded-full" aria-hidden />
          <div className="relative rounded-[1.75rem] overflow-hidden shadow-warm ring-1 ring-border/50">
            <img
              src={heroImage}
              alt="Open Bible beside a wooden bowl of fresh berries, avocado, almonds and herbs in soft morning light"
              width={1536}
              height={1024}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="hidden md:block absolute -bottom-5 -left-5 rounded-2xl bg-card shadow-card p-4 max-w-[260px] ring-1 ring-border/60">
            <p className="font-serif italic text-primary leading-snug text-sm">
              "Beloved, I wish above all things that thou mayest prosper and be in health."
            </p>
            <p className="mt-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">3 John 1:2</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
