import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaTo?: string;
  ctaLabel?: string;
}

const EmptyState = ({ icon, title, description, ctaTo, ctaLabel }: Props) => (
  <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border/60">
    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">
      {icon ?? <Sparkles className="h-5 w-5" />}
    </div>
    <h3 className="mt-4 font-serif text-xl text-primary">{title}</h3>
    {description && <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>}
    {ctaTo && ctaLabel && (
      <Button asChild variant="hero" size="sm" className="mt-5">
        <Link to={ctaTo}>{ctaLabel}</Link>
      </Button>
    )}
  </div>
);

export default EmptyState;
