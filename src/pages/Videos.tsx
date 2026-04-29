import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { videos } from "@/data/content";
import { Play } from "lucide-react";

const Videos = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <PageHeader
          eyebrow="Watch & learn"
          title="Videos from the community."
          description="Short cooking demos and video devotions shared by Uzima contributors."
        />
        <section className="container py-10 lg:py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((v) => (
              <article
                key={v.id}
                className="group rounded-2xl bg-card overflow-hidden shadow-card ring-1 ring-border/60 transition-smooth hover:-translate-y-1 hover:shadow-warm"
              >
                <div className={`relative aspect-video bg-gradient-to-br ${v.accent} flex items-center justify-center`}>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-card/95 backdrop-blur shadow-soft transition-smooth group-hover:scale-110">
                    <Play className="h-5 w-5 text-primary translate-x-0.5" fill="currentColor" />
                  </span>
                  <span className="absolute bottom-3 right-3 rounded-md bg-primary/90 px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                    {v.duration}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl text-primary leading-snug">{v.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">by {v.author}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{v.excerpt}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {v.tags.map((t) => (
                      <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Videos;
