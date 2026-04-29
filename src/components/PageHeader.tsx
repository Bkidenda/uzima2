interface Props {
  eyebrow: string;
  title: string;
  description: string;
}

const PageHeader = ({ eyebrow, title, description }: Props) => (
  <section className="bg-gradient-warm border-b border-border/50">
    <div className="container py-10 lg:py-14 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.22em] text-accent font-medium">{eyebrow}</p>
      <h1 className="mt-2 font-serif text-4xl lg:text-5xl text-primary text-balance">{title}</h1>
      <p className="mt-3 text-base text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </section>
);

export default PageHeader;
