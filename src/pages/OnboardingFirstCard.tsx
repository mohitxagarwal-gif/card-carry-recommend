import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/onboarding/SegmentedControl";
import { TrustBadge } from "@/components/onboarding/TrustBadge";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { Lock, Zap } from "lucide-react";

const OnboardingFirstCard = () => {
  const [choice, setChoice] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Check if user already made a choice
        const saved = localStorage.getItem(`first_card_choice_${user.id}`);
        if (saved) {
          setChoice(saved === "bank" ? "yes" : "no");
        }
      }
    };
    
    initUser();
    trackEvent("onboarding_first_card_view");
  }, []);

  const handleContinue = () => {
    if (!choice || !userId) return;
    
    const mode = choice === "yes" ? "bank" : "credit";
    
    // Save choice to localStorage
    localStorage.setItem(`first_card_choice_${userId}`, mode);
    
    // Track analytics
    trackEvent("onboarding_first_card_selected", { choice });
    
    // Check if there's a saved destination from onboarding basics
    const destination = localStorage.getItem(`post_first_card_destination_${userId}`);
    localStorage.removeItem(`post_first_card_destination_${userId}`);
    
    // Navigate to upload with mode, or to saved destination with mode
    if (destination && destination !== '/upload') {
      navigate(`${destination}?mode=${mode}`, { replace: true });
    } else {
      navigate(`/upload?mode=${mode}`, { replace: true });
    }
  };

  const handleSaveAndFinishLater = () => {
    if (choice && userId) {
      const mode = choice === "yes" ? "bank" : "credit";
      localStorage.setItem(`first_card_choice_${userId}`, mode);
      trackEvent("onboarding_first_card_saved_for_later", { choice });
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Left column - Introduction */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-heading font-bold text-foreground mb-6">
                one quick question
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We need to know what type of statements to ask for. This helps us give you the most accurate recommendations.
              </p>
            </div>

            {/* Trust badges */}
            <div className="space-y-4 pt-4">
              <TrustBadge
                icon={Lock}
                text="Your data is encrypted and never shared"
              />
              <TrustBadge
                icon={Zap}
                text="Takes less than 30 seconds"
              />
            </div>
          </div>

          {/* Right column - Form */}
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">
                  Is this your first credit card?
                </Label>
                <SegmentedControl
                  name="first-card"
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                  ]}
                  value={choice}
                  onValueChange={setChoice}
                />
                <p className="text-sm text-muted-foreground mt-3">
                  This just decides which statements we ask for.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleContinue}
                  disabled={!choice}
                >
                  Continue
                </Button>
                
                <button
                  onClick={handleSaveAndFinishLater}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Save & finish later
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFirstCard;
