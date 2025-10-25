import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-6 lg:px-12 py-24 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair italic font-medium text-foreground mb-8 leading-tight">
          ready to find your perfect match?
        </h2>
        <p className="text-lg md:text-xl font-sans text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
          let's analyze your spending and discover cards that work as hard as you do
        </p>
        <Button 
          size="lg"
          onClick={() => navigate("/auth")}
          className="group bg-primary text-primary-foreground hover:bg-primary/90 font-sans transition-all duration-300 px-8 py-6 text-base"
        >
          start your analysis
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
