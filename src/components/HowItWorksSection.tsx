const steps = [
  {
    number: "01",
    title: "upload",
    description: "share your bank or credit card statements securely. we support all major indian banks."
  },
  {
    number: "02",
    title: "analyze",
    description: "our system categorizes your spending patterns across lifestyle, travel, dining, and more."
  },
  {
    number: "03",
    title: "discover",
    description: "receive curated recommendations that maximize rewards for your unique spending profile."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="container mx-auto px-6 lg:px-12 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-playfair italic font-medium text-foreground mb-6">
            three simple steps
          </h2>
          <p className="text-lg font-sans text-muted-foreground max-w-2xl mx-auto">
            a refined approach to finding your perfect credit card match
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="group relative"
              style={{ 
                animation: 'fade-in 0.6s ease-out',
                animationDelay: `${index * 0.15}s`,
                animationFillMode: 'both'
              }}
            >
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <span className="text-7xl md:text-8xl font-playfair italic font-light text-foreground/10 group-hover:text-foreground/20 transition-colors duration-500">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-playfair italic font-medium text-foreground">
                  {step.title}
                </h3>
                <p className="text-base font-sans text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/4 -right-8 w-16 h-[1px] bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
