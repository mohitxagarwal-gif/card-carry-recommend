import { useSiteContent } from "@/hooks/useSiteContent";
import { GlassCard } from "./ui/glass-card";
import { SparklesIcon, RewardsIcon, CashbackIcon } from "./icons";

interface SiteContent {
  content: any;
}

const HowItWorksSection = () => {
  const { siteContent } = useSiteContent("how_it_works");

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
    <section id="how-it-works" className="container mx-auto px-4 md:px-6 lg:px-12 py-12 md:py-24 lg:py-32 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground text-center mb-8 md:mb-12 lg:mb-16 leading-tight">
          {content.title}
        </h2>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {content.steps.map((step: any, idx: number) => (
            <GlassCard
              key={step.number}
              variant="elevated"
              className="p-4 md:p-6 lg:p-8 group cursor-pointer animate-fade-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="mb-4 md:mb-6 group-hover:rotate-[10deg] transition-transform duration-140">
                {getIcon(step.icon)}
              </div>
              <div className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-primary/10 mb-3 md:mb-4">
                {step.number}
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-foreground mb-3 md:mb-4">
                {step.title}
              </h3>
              <p className="text-sm md:text-base lg:text-lg font-sans text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </GlassCard>
          ))}
        </div>
        
        <div className="text-center mt-12 animate-fade-up" style={{ animationDelay: '180ms' }}>
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
