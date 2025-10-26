const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="container mx-auto px-6 lg:px-12 py-24 md:py-32 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground text-center mb-16 leading-tight">
          how card & carry works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          <div className="group hover:scale-105 transition-transform duration-300">
            <div className="text-7xl md:text-8xl font-heading font-bold text-primary/10 mb-4">01</div>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
              tell us your basics
            </h3>
            <p className="text-base md:text-lg font-sans text-muted-foreground leading-relaxed">
              spending categories, travel, dining, online shopping — share your habits with us.
            </p>
          </div>

          <div className="group hover:scale-105 transition-transform duration-300">
            <div className="text-7xl md:text-8xl font-heading font-bold text-primary/10 mb-4">02</div>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
              we match your benefits
            </h3>
            <p className="text-base md:text-lg font-sans text-muted-foreground leading-relaxed">
              rewards, lounge, cashback, forex, co-brands — we find what fits your lifestyle.
            </p>
          </div>

          <div className="group hover:scale-105 transition-transform duration-300">
            <div className="text-7xl md:text-8xl font-heading font-bold text-primary/10 mb-4">03</div>
            <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
              compare & apply
            </h3>
            <p className="text-base md:text-lg font-sans text-muted-foreground leading-relaxed">
              fit score + clear fee/perk breakdown for confident decisions.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <a 
            href="/auth"
            className="inline-flex items-center text-base md:text-lg font-sans text-primary hover:text-primary/80 transition-colors duration-300 underline underline-offset-4"
          >
            try the recommender →
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
