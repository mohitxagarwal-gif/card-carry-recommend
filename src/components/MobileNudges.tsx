import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useCompare } from "@/contexts/CompareContext";
import { toast } from "sonner";

export const MobileNudges = () => {
  const navigate = useNavigate();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showScrollBanner, setShowScrollBanner] = useState(false);
  const { selectedCards } = useCompare();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Show sticky bar after scrolling 100vh
      setShowStickyBar(scrollY > windowHeight);
      
      // Show scroll banner after passing "How It Works" section
      const howItWorksSection = document.getElementById('how-it-works');
      if (howItWorksSection) {
        const sectionBottom = howItWorksSection.offsetTop + howItWorksSection.offsetHeight;
        setShowScrollBanner(scrollY > sectionBottom);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Sticky Bottom Bar - Mobile Only */}
      {showStickyBar && selectedCards.length === 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-primary/95 backdrop-blur-md border-t border-border/30 px-6 py-4 animate-in slide-in-from-bottom duration-300">
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-sans"
          >
            try the recommender →
          </Button>
        </div>
      )}

      {/* Scroll Inline Banner */}
      {showScrollBanner && (
        <div className="container mx-auto px-6 lg:px-12 mb-12">
          <div className="max-w-4xl mx-auto bg-accent/20 rounded-xl border border-accent/30 p-8 text-center">
            <p className="text-lg md:text-xl font-sans text-foreground mb-4">
              not sure what fits?
            </p>
            <p className="text-base font-sans text-muted-foreground mb-6">
              see your top 3 cards in under 2 minutes
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-sans"
            >
              start my match →
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
