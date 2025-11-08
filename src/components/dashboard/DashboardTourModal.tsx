import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, X, Sparkles, Heart, FileText, CreditCard, TrendingUp } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightSelector?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Your Dashboard! 🎉",
    description: "This is your command center for managing credit cards, tracking savings, and discovering opportunities. Let's take a quick tour of the key features.",
    icon: <Sparkles className="w-8 h-8 text-primary" />,
  },
  {
    id: "recommendations",
    title: "Personalized Recommendations",
    description: "View your estimated annual savings and explore card recommendations tailored to your spending patterns. You can refresh these anytime as your spending evolves.",
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
    highlightSelector: "[data-tour-id='recommendations-module']",
  },
  {
    id: "shortlist",
    title: "Your Shortlist",
    description: "Save cards you're interested in to your shortlist for quick comparison and easy access. Track which ones you're considering applying for.",
    icon: <Heart className="w-8 h-8 text-primary" />,
    highlightSelector: "[data-tour-id='shortlist-module']",
  },
  {
    id: "my-cards",
    title: "Manage Your Cards",
    description: "Add your existing credit cards to track fee waivers, monitor lounge access quotas, and set spending goals. Never miss a renewal or benefit again.",
    icon: <CreditCard className="w-8 h-8 text-primary" />,
    highlightSelector: "[data-tour-id='my-cards-module']",
  },
  {
    id: "next-steps",
    title: "Smart Next Steps",
    description: "Get personalized action items based on your activity. We'll suggest when to apply for cards, update your profile, or re-analyze statements.",
    icon: <FileText className="w-8 h-8 text-primary" />,
    highlightSelector: "[data-tour-id='next-steps-module']",
  },
];

interface DashboardTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DashboardTourModal = ({ open, onOpenChange }: DashboardTourModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("dashboard_tour_completed", "true");
    onOpenChange(false);
  };

  const handleSkip = () => {
    localStorage.setItem("dashboard_tour_completed", "true");
    onOpenChange(false);
  };

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Dashboard Tour</DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </DialogHeader>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              <div className="inline-flex p-4 bg-primary/10 rounded-full">
                {step.icon}
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-heading font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                  {step.description}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-4">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? "w-8 bg-primary"
                        : index < currentStep
                        ? "w-2 bg-primary/50"
                        : "w-2 bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleSkip}
          >
            Skip Tour
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
