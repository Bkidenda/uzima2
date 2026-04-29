const VerseBanner = () => {
  return (
    <section className="py-12 lg:py-16">
      <div className="container">
        <div className="relative mx-auto max-w-4xl rounded-[1.75rem] bg-gradient-verse p-8 lg:p-12 text-center shadow-soft ring-1 ring-border/50 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" aria-hidden>
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-accent blur-3xl" />
          </div>
          <p className="relative font-serif text-2xl sm:text-3xl lg:text-4xl text-primary leading-snug italic text-balance">
            "Whether therefore ye eat, or drink, or whatsoever ye do,
            do all to the glory of God."
          </p>
          <p className="relative mt-4 text-xs uppercase tracking-[0.25em] text-accent font-medium">
            1 Corinthians 10:31
          </p>
        </div>
      </div>
    </section>
  );
};

export default VerseBanner;
