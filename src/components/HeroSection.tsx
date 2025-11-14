import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

interface SiteContent {
  content: any;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const { siteContent } = useSiteContent("hero");

  const content = (siteContent as SiteContent | null)?.content || {
    headline: "find the credit card that fits your life.",
    subheadline: "tell us how you spend. we match you to cards with fees that make sense and perks you'll actually use.",
    cta_text: "start my match",
    secondary_cta: "browse all cards",
    footer_text: "free • no impact on credit score • takes < 2 minutes"
  };

  const scrollToExplore = () => {
    const exploreSection = document.getElementById('explore-cards');
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative overflow-hidden px-4 md:px-6 lg:px-12 py-16 md:py-24 lg:py-32 text-center">
      {/* Ambient parallax background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/3 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/4 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-4 md:mb-6 leading-tight animate-fade-up" style={{ animationDelay: '0ms' }}>
          {content.headline}
        </h1>
        
        <p className="text-sm md:text-base lg:text-xl font-sans text-muted-foreground mb-6 md:mb-8 leading-relaxed max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '60ms' }}>
          {content.subheadline}
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs font-sans text-subtle animate-fade-up" style={{ animationDelay: '180ms' }}>
          <span className="px-3 py-1 rounded-pill bg-muted">free</span>
          <span className="px-3 py-1 rounded-pill bg-muted">no credit score impact</span>
          <span className="px-3 py-1 rounded-pill bg-muted">under 2 minutes</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 animate-fade-up w-full px-4 sm:px-0" style={{ animationDelay: '120ms' }}>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="group font-sans px-6 md:px-8 py-5 md:py-6 text-sm md:text-base gloss-band w-full sm:w-auto min-h-[48px]"
          >
            {content.cta_text}
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={scrollToExplore}
            className="group font-sans px-6 md:px-8 py-5 md:py-6 text-sm md:text-base border-foreground/20 hover:bg-foreground/5 w-full sm:w-auto min-h-[48px]"
          >
            {content.secondary_cta}
          </Button>
        </div>

        <p className="text-sm font-sans text-muted-foreground mt-8 max-w-xl mx-auto">
          {content.footer_text}
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
