import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Calculator, Target, ArrowRight, Loader2, Check, Info } from "lucide-react";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { RadioGrid } from "@/components/onboarding/RadioGrid";
import { CityCombobox } from "@/components/onboarding/CityCombobox";
import { TrustBadge } from "@/components/onboarding/TrustBadge";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { isOnboardingComplete } from "@/lib/authUtils";

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"];
const INCOME_BANDS = [
  { value: "0-25000", label: "< ₹25K/month" },
  { value: "25000-50000", label: "₹25K - ₹50K" },
  { value: "50000-100000", label: "₹50K - ₹1L" },
  { value: "100000-200000", label: "₹1L - ₹2L" },
  { value: "200000+", label: "> ₹2L/month" }
];

export default function OnboardingStart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Profile state
  const [profileComplete, setProfileComplete] = useState(false);
  const [ageRange, setAgeRange] = useState<string>("");
  const [incomeBand, setIncomeBand] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Step state
  const [showPathSelection, setShowPathSelection] = useState(false);

  useEffect(() => {
    const initProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // If user has profile data, show path selection instead of redirecting
      if (profile?.age_range && profile?.income_band_inr) {
        console.log('[OnboardingStart] Pre-filling existing profile data');
        setAgeRange(profile.age_range);
        setIncomeBand(profile.income_band_inr);
        setCity(profile.city || "");
        setProfileComplete(true);
        setShowPathSelection(true);
      }

      setChecking(false);
    };

    initProfile();
    trackEvent("onboarding.start_viewed");
  }, [navigate]);

  const handleProfileSubmit = async () => {
    if (!ageRange || !incomeBand) {
      toast.error("Please select your age range and income band");
      return;
    }

    if (!userId) return;

    setSavingProfile(true);
    
    try {
    const { error } = await supabase
      .from("profiles")
      .update({
        age_range: ageRange,
        income_band_inr: incomeBand,
        city: city || null,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

      if (error) throw error;

      trackEvent("onboarding.profile_collected", {
        age_range: ageRange,
        income_band: incomeBand,
        has_city: !!city
      });

      setProfileComplete(true);
      setShowPathSelection(true);
      toast.success("Profile saved! Now choose your onboarding path.");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePathSelect = (path: 'upload' | 'quick-spends' | 'goal-based') => {
    trackEvent("onboarding.path_selected", { path });
    
    const returnTo = searchParams.get('returnTo');
    
    // If returnTo exists and matches the selected path, navigate directly to it
    if (returnTo) {
      if (
        (path === 'quick-spends' && returnTo.includes('/onboarding/quick-spends')) ||
        (path === 'goal-based' && returnTo.includes('/onboarding/goal-based')) ||
        (path === 'upload' && returnTo.includes('/upload'))
      ) {
        navigate(returnTo, { replace: true });
        return;
      }
    }
    
    // Otherwise navigate to the selected path normally
    if (path === 'upload') {
      navigate('/upload');
    } else if (path === 'quick-spends') {
      navigate('/onboarding/quick-spends');
    } else {
      navigate('/onboarding/goal-based');
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className={`flex items-center gap-2 ${!showPathSelection ? 'text-primary font-medium' : ''}`}>
              {profileComplete ? <Check className="w-4 h-4 text-primary" /> : <div className="w-4 h-4 rounded-full border-2 border-primary" />}
              <span>Profile</span>
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className={`flex items-center gap-2 ${showPathSelection ? 'text-primary font-medium' : ''}`}>
              <div className="w-4 h-4 rounded-full border-2 border-current" />
              <span>Choose Path</span>
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-current" />
              <span>Get Recommendations</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading font-bold">
              {showPathSelection ? "How would you like to get started?" : "Let's get to know you"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {showPathSelection 
                ? "Choose the path that works best for you" 
                : "We'll use this to filter cards you're eligible for"}
            </p>
          </div>

          {/* Step 1: Profile Collection */}
          {!showPathSelection && (
            <Card className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Age Range *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Many cards have age requirements. This helps us show you eligible cards.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <RadioGrid
                    options={AGE_RANGES.map(r => ({ value: r, label: r }))}
                    value={ageRange}
                    onValueChange={setAgeRange}
                    name="age_range"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-medium">Monthly Income *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Cards have income requirements. Your income helps us filter to cards you qualify for.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <RadioGrid
                    options={INCOME_BANDS}
                    value={incomeBand}
                    onValueChange={setIncomeBand}
                    name="income_band"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">City (Optional)</Label>
                  <CityCombobox value={city} onChange={setCity} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  <TrustBadge icon={Info} text="Your data is encrypted & secure" />
                  <TrustBadge icon={Check} text="Never shared with third parties" />
                </div>
                <Button
                  onClick={handleProfileSubmit} 
                  className="w-full" 
                  size="lg"
                  disabled={!ageRange || !incomeBand || savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Path Selection */}
          {showPathSelection && (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Upload Statements */}
                <Card className="p-6 hover:border-primary transition-all cursor-pointer group hover:shadow-lg">
                  <button 
                    onClick={() => handlePathSelect('upload')}
                    className="w-full text-left space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">SmartScan</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload your bank/card statements for AI-powered analysis of your actual spending patterns
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        ⭐⭐⭐⭐⭐ Most Accurate
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        5 min
                      </span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Analyzes 3-6 months of transactions</li>
                      <li>• Your data is encrypted & never shared</li>
                    </ul>
                  </button>
                </Card>

                {/* Quick Manual Input */}
                <Card className="p-6 hover:border-primary transition-all cursor-pointer group hover:shadow-lg">
                  <button 
                    onClick={() => handlePathSelect('quick-spends')}
                    className="w-full text-left space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Calculator className="w-6 h-6 text-primary" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">QuickSpends</h3>
                      <p className="text-sm text-muted-foreground">
                        Tell us your monthly spend and top categories - perfect if you know your spending habits
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        ⚡ Fastest
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        2 min
                      </span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Adjust sliders for each category</li>
                      <li>• Upload statements later for accuracy boost</li>
                    </ul>
                  </button>
                </Card>

                {/* Goal-Based */}
                <Card className="p-6 hover:border-primary transition-all cursor-pointer group hover:shadow-lg">
                  <button 
                    onClick={() => handlePathSelect('goal-based')}
                    className="w-full text-left space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">GoalPick</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose your primary goal (travel, cashback, dining) and we'll optimize recommendations for that
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        🎯 Goal-Focused
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        1 min
                      </span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Pre-configured spending profiles</li>
                      <li>• Best for users with clear priorities</li>
                    </ul>
                  </button>
                </Card>
              </div>

              {/* Comparison Table */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Which path is right for you?</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Path</th>
                        <th className="text-left py-2">Time</th>
                        <th className="text-left py-2">Accuracy</th>
                        <th className="text-left py-2">Best For</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-3 font-medium">SmartScan</td>
                        <td className="py-3">5 min</td>
                        <td className="py-3">⭐⭐⭐⭐⭐</td>
                        <td className="py-3">Power users who want the most accurate recommendations</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 font-medium">QuickSpends</td>
                        <td className="py-3">2 min</td>
                        <td className="py-3">⭐⭐⭐</td>
                        <td className="py-3">Quick start, know your spending patterns</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-medium">GoalPick</td>
                        <td className="py-3">1 min</td>
                        <td className="py-3">⭐⭐⭐</td>
                        <td className="py-3">Clear goals like travel rewards or cashback</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Footer Note */}
              <p className="text-center text-sm text-muted-foreground">
                Don't worry, you can always upload statements later for more accurate recommendations
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
