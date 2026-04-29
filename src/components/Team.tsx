import { Mail } from "lucide-react";

const team = [
  {
    name: "Lorra Obare",
    role: "Co-founder",
    bio: "Passionate about whole-person wellness and bringing scripture into everyday meals.",
    email: "lorra@uzimacommunity.com",
  },
  {
    name: "Max Mwaura",
    role: "Co-founder",
    bio: "Builds the spaces where community happens — focused on connection, not clutter.",
    email: "max@uzimacommunity.com",
  },
  {
    name: "Brian Kidenda",
    role: "Co-founder",
    bio: "Believes faith and health belong together, and that stories carry both forward.",
    email: "brian@uzimacommunity.com",
  },
];

const Team = () => {
  return (
    <section id="team" className="py-12 lg:py-16">
      <div className="container max-w-5xl">
        <p className="text-xs uppercase tracking-[0.22em] text-accent font-medium text-center">Our team</p>
        <h2 className="mt-2 font-serif text-3xl lg:text-4xl text-primary text-center text-balance">
          The people behind Uzima
        </h2>
        <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto text-sm">
          A small team that cares deeply about faith, health, and the friendships that grow between them.
        </p>
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {team.map((m) => (
            <article key={m.name} className="rounded-2xl bg-card p-6 ring-1 ring-border/60 shadow-card text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground font-serif text-xl">
                {m.name.split(" ").map((n) => n[0]).join("")}
              </span>
              <h3 className="mt-4 font-serif text-lg text-primary">{m.name}</h3>
              <p className="text-xs uppercase tracking-wider text-accent mt-0.5">{m.role}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
              <a
                href={`mailto:${m.email}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-smooth"
              >
                <Mail className="h-3.5 w-3.5" />
                {m.email}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
