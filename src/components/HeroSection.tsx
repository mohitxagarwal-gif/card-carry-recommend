import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import FloatingCardStack from "./FloatingCardStack";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface SiteContent {
  content: any;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const { siteContent } = useSiteContent("hero");
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

  const content = (siteContent as SiteContent | null)?.content || {
    headline: "find the credit card that fits your life.",
    subheadline: "tell us how you spend. we match you to cards with fees and perks you'll actually use.",
    cta_text: "start my match",
    secondary_cta: "browse all cards"
  };

  const scrollToExplore = () => {
    const exploreSection = document.getElementById('explore-cards');
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section ref={ref} className="relative overflow-hidden px-4 md:px-6 lg:px-12 py-12 md:py-20 lg:py-24 text-center">
      {/* Ambient parallax background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/3 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/4 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <h1 className={`text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6 leading-tight transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {content.headline}
        </h1>
        
        <p className={`text-base md:text-lg lg:text-xl font-sans text-muted-foreground mb-4 leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {content.subheadline}
        </p>

        {/* Floating Card Stack Illustration */}
        <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <FloatingCardStack />
        </div>
        
        <div className={`flex flex-wrap items-center justify-center gap-3 mb-8 text-xs font-sans text-muted-foreground transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            no credit score impact
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            under 2 minutes
          </span>
        </div>
        
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full px-4 sm:px-0 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="group font-sans px-8 py-6 text-base gloss-band w-full sm:w-auto min-h-[52px]"
          >
            {content.cta_text}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={scrollToExplore}
            className="group font-sans px-8 py-6 text-base border-foreground/20 hover:bg-foreground/5 w-full sm:w-auto min-h-[52px]"
          >
            {content.secondary_cta}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
