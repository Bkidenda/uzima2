import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-12 lg:py-16">
      <div className="container">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-hero px-8 py-12 lg:px-14 lg:py-16 text-center shadow-warm">
          <div className="absolute inset-0 opacity-20" aria-hidden>
            <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-gold blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-accent blur-3xl" />
          </div>
          <div className="relative max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl lg:text-5xl text-primary-foreground text-balance leading-tight">
              Bring your gift to the table.
            </h2>
            <p className="mt-4 text-base lg:text-lg text-primary-foreground/85">
              Whether it's a beloved recipe, a verse that shaped you, or a story
              of healing — your contribution can nourish someone today.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button variant="accent" size="lg" asChild>
                <Link to="/auth">
                  Create your free account
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Read the guidelines
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
