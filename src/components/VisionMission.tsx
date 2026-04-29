import { Compass, Target } from "lucide-react";

const VisionMission = () => {
  return (
    <section id="vision" className="py-12 lg:py-16 bg-gradient-warm border-y border-border/50">
      <div className="container max-w-5xl">
        <p className="text-xs uppercase tracking-[0.22em] text-accent font-medium text-center">Our heart</p>
        <h2 className="mt-2 font-serif text-3xl lg:text-4xl text-primary text-center text-balance">
          Vision &amp; Mission
        </h2>
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-card p-6 lg:p-7 ring-1 ring-border/60 shadow-card">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
              <Compass className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-serif text-xl text-primary">Our Vision</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              A thriving, Christ-centered community where every member is empowered to live a healthy,
              joyful life — body, mind, and spirit — and to share that gift freely with others.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-6 lg:p-7 ring-1 ring-border/60 shadow-card">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
              <Target className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-serif text-xl text-primary">Our Mission</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              To nurture wholeness through wholesome food, faith reflections, and genuine connection —
              equipping members to encourage one another with recipes, devotions, and shared stories.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionMission;
