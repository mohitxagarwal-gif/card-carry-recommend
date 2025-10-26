import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToExplore = () => {
    const exploreSection = document.getElementById('explore-cards');
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="container mx-auto px-6 lg:px-12 py-24 md:py-32 lg:py-40">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold text-ink mb-6 leading-tight animate-fade-in">
          hello perks. bye fees.
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl font-body text-subtle mb-12 leading-relaxed max-w-3xl mx-auto animate-fade-in">
          no jargon. no spam. card & carry matches you to cards based on your spending and the benefits you actually use.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-scale-in">
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="group font-body transition-all duration-150 px-8 py-6 text-base hover:-translate-y-0.5"
          >
            start my match
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-150" />
          </Button>
          <Button 
            size="lg"
            variant="ghost"
            onClick={scrollToExplore}
            className="font-body transition-all duration-150 px-8 py-6 text-base"
          >
            browse all cards
          </Button>
        </div>
        <p className="text-xs md:text-sm font-body text-subtle">
          free • no impact on credit score • takes &lt; 2 minutes
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
