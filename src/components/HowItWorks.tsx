import { UserPlus, PenLine, Users } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create your profile",
    desc: "Join free. Add a photo and a short bio so the community can know you.",
  },
  {
    icon: PenLine,
    title: "Share what nourishes you",
    desc: "Post a recipe, a devotion, an article, or a short cooking video.",
  },
  {
    icon: Users,
    title: "Encourage one another",
    desc: "Like, comment, and uplift fellow believers walking the same path.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-12 lg:py-16">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-accent font-medium">How Uzima works</p>
          <h2 className="mt-2 font-serif text-3xl lg:text-4xl text-primary text-balance">
            Simple to join. Meaningful to share.
          </h2>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative text-center animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="relative inline-block">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-soft mx-auto">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-gold text-gold-foreground font-serif text-xs font-semibold">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-xl text-primary">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
