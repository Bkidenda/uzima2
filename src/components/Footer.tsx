import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/60 py-10 bg-background">
      <div className="container grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-primary">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            Uzima
          </Link>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
            A community where health, food, and God's word come together.
            Made with care for those who seek to glorify God in body and spirit.
          </p>
        </div>
        <div>
          <h4 className="font-serif text-base text-primary">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/recipes" className="hover:text-accent transition-smooth">Recipes</Link></li>
            <li><Link to="/devotions" className="hover:text-accent transition-smooth">Devotions</Link></li>
            <li><Link to="/videos" className="hover:text-accent transition-smooth">Videos</Link></li>
            <li><Link to="/articles" className="hover:text-accent transition-smooth">Articles</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-base text-primary">Community</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/communities" className="hover:text-accent transition-smooth">Communities</Link></li>
            <li><Link to="/messages" className="hover:text-accent transition-smooth">Messages</Link></li>
            <li><Link to="/#team" className="hover:text-accent transition-smooth">Our team</Link></li>
            <li><Link to="/#contact" className="hover:text-accent transition-smooth">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-base text-primary">About</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/#vision" className="hover:text-accent transition-smooth">Vision &amp; mission</Link></li>
            <li><Link to="/privacy" className="hover:text-accent transition-smooth">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-accent transition-smooth">Terms &amp; conditions</Link></li>
            <li><a href="mailto:info@uzimacommunity.com" className="hover:text-accent transition-smooth">info@uzimacommunity.com</a></li>
          </ul>
        </div>
      </div>
      <div className="container mt-8 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Uzima Community. To God be the glory.</p>
        <p className="italic font-serif">"…that thou mayest prosper and be in health." — 3 John 1:2</p>
      </div>
    </footer>
  );
};

export default Footer;
