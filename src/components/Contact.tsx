import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-12 lg:py-16 bg-gradient-warm border-y border-border/50">
      <div className="container max-w-4xl">
        <p className="text-xs uppercase tracking-[0.22em] text-accent font-medium text-center">Get in touch</p>
        <h2 className="mt-2 font-serif text-3xl lg:text-4xl text-primary text-center text-balance">
          Contact us
        </h2>
        <p className="mt-3 text-center text-muted-foreground text-sm max-w-xl mx-auto">
          Questions, feedback, or partnership ideas? We'd love to hear from you.
        </p>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <a
            href="mailto:info@uzimacommunity.com"
            className="rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-card text-center hover:ring-primary/30 transition-smooth"
          >
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
              <Mail className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Email</p>
            <p className="mt-1 font-medium text-primary text-sm break-all">info@uzimacommunity.com</p>
          </a>
          <a
            href="tel:+254742205755"
            className="rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-card text-center hover:ring-primary/30 transition-smooth"
          >
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
              <Phone className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Phone</p>
            <p className="mt-1 font-medium text-primary text-sm">+254 742 205 755</p>
          </a>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60 shadow-card text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Based in</p>
            <p className="mt-1 font-medium text-primary text-sm">Nairobi, Kenya</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
