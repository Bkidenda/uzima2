import { ChefHat, BookOpen, Video, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const items = [
  { to: "/recipes", icon: ChefHat, title: "Recipes", desc: "Plant-based meals with health benefits and faith reflections." },
  { to: "/videos", icon: Video, title: "Cooking Videos", desc: "Short and long-form videos from the community kitchen." },
  { to: "/devotions", icon: BookOpen, title: "Devotions", desc: "Scripture-rooted reflections for daily encouragement." },
  { to: "/articles", icon: FileText, title: "Articles", desc: "Original writing on health, lifestyle, and spiritual growth." },
];

const Categories = () => {
  return (
    <section className="bg-gradient-warm py-12 lg:py-16">
      <div className="container">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-accent font-medium">What you'll share</p>
          <h2 className="mt-2 font-serif text-3xl lg:text-4xl text-primary text-balance">
            Four ways to nourish the community.
          </h2>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(({ to, icon: Icon, title, desc }, i) => (
            <Link
              key={to}
              to={to}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group relative rounded-2xl bg-card p-5 shadow-card ring-1 ring-border/60 transition-smooth hover:-translate-y-1 hover:shadow-warm animate-fade-up"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-serif text-xl text-primary">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              <span className="mt-3 inline-block text-sm font-medium text-accent">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
