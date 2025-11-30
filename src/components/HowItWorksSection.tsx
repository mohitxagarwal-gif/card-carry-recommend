import { useSiteContent } from "@/hooks/useSiteContent";
import { SparklesIcon, RewardsIcon, CashbackIcon } from "./icons";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface SiteContent {
  content: any;
}

const HowItWorksSection = () => {
  const { siteContent } = useSiteContent("how_it_works");
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });

  const content = (siteContent as SiteContent | null)?.content || {
    title: "how card & carry works",
    steps: [
      {
        number: "01",
        title: "tell us about you",
        description: "spend categories, travel, dining, online shopping—just the basics.",
        icon: "sparkles"
      },
      {
        number: "02",
        title: "we crunch the benefits",
        description: "rewards, lounges, cashback, forex, co-brands—what actually nets you value.",
        icon: "rewards"
      },
      {
        number: "03",
        title: "see your picks",
        description: "clear fit score, fees, and perks. compare side-by-side and apply.",
        icon: "cashback"
      }
    ],
    cta_text: "try the recommender →"
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "rewards":
        return <RewardsIcon className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-primary" />;
      case "cashback":
        return <CashbackIcon className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-primary" />;
      default:
        return <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-primary" />;
    }
  };

  return (
    <section ref={ref} id="how-it-works" className="container mx-auto px-4 md:px-6 lg:px-12 py-16 md:py-24 lg:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className={`text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground text-center mb-12 md:mb-16 leading-tight transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {content.title}
        </h2>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto">
          {content.steps.map((step: any, idx: number) => (
            <div
              key={step.number}
              className={`group cursor-pointer p-6 md:p-8 rounded-card bg-background/80 border border-border/50 shadow-md hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ 
                transitionDelay: isVisible ? `${idx * 100 + 200}ms` : '0ms'
              }}
            >
              <div className="mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                {getIcon(step.icon)}
              </div>
              <div className="text-5xl md:text-6xl font-heading font-bold text-primary/15 mb-4">
                {step.number}
              </div>
              <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-sm md:text-base font-sans text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className={`text-center mt-12 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <a 
            href="/auth"
            className="inline-flex items-center text-base md:text-lg font-sans text-primary hover:text-primary/80 transition-colors duration-300 underline underline-offset-4"
          >
            {content.cta_text}
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
