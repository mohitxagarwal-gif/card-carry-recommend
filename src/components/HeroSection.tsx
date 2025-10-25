import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-6 lg:px-12 pt-20 pb-32 md:pt-32 md:pb-40">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-playfair italic font-medium text-foreground mb-8 leading-tight animate-fade-in">
          discover cards that understand your spending
        </h2>
        <p className="text-lg md:text-xl font-sans text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
          upload your statements. we analyze your patterns. you get personalized recommendations.
        </p>
        <Button 
          size="lg" 
          onClick={() => navigate("/auth")}
          className="group bg-primary text-primary-foreground hover:bg-primary/90 font-sans transition-all duration-300 animate-fade-in px-8 py-6 text-base"
          style={{ animationDelay: '0.2s' }}
        >
          begin your journey
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
