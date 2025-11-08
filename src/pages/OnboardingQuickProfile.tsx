import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Shield, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TrustBadge } from "@/components/onboarding/TrustBadge";
import { SegmentedControl } from "@/components/onboarding/SegmentedControl";
import { RadioGrid } from "@/components/onboarding/RadioGrid";
import { CityCombobox } from "@/components/onboarding/CityCombobox";
import { QuickSpendingHints } from "@/components/onboarding/QuickSpendingHints";
import { trackEvent } from "@/lib/analytics";
import { useDeriveFeatures } from "@/hooks/useDeriveFeatures";

const AGE_OPTIONS = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" },
];

const INCOME_OPTIONS = [
  { value: "0-25000", label: "<₹25k" },
  { value: "25000-50000", label: "₹25-50k" },
  { value: "50000-100000", label: "₹50k-1L" },
  { value: "100000-200000", label: "₹1-2L" },
  { value: "200000+", label: "₹2L+" },
];

export default function OnboardingQuickProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const deriveFeatures = useDeriveFeatures();

  const [ageRange, setAgeRange] = useState("");
  const [incomeBand, setIncomeBand] = useState("");
  const [isFirstCard, setIsFirstCard] = useState<boolean | null>(null);
  const [city, setCity] = useState<string>("");
  
  // Optional spending hints
  const [monthlySpend, setMonthlySpend] = useState(50000);
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, age_range, income_band_inr")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate('/upload', { replace: true });
        return;
      }

      setChecking(false);
    };

    checkProfile();
    trackEvent("onboarding_quick_profile_view");
  }, [navigate]);

  const handleSubmit = async (skipToUpload = false) => {
    if (!ageRange || !incomeBand) {
      toast.error("Please select age range and income level");
      return;
    }

    if (isFirstCard === null) {
      toast.error("Please let us know if this is your first credit card");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          age_range: ageRange,
          income_band_inr: incomeBand,
          city: city || null,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (profileError) throw profileError;

      // Create basic preferences record
      const { error: prefsError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: session.user.id,
          fee_tolerance_band: "<=5k", // Default
          updated_at: new Date().toISOString(),
        });

      if (prefsError) throw prefsError;

      // If user provided spending hints, create spend data
      let spendData = null;
      if (topCategories.length > 0) {
        const split: Record<string, number> = {};
        const sharePerCategory = 100 / topCategories.length;
        topCategories.forEach(cat => {
          split[cat] = sharePerCategory;
        });
        spendData = { monthlySpend, spendSplit: split };
      }

      // Call derive-user-features with smart defaults
      await deriveFeatures.mutateAsync({
        userId: session.user.id,
        spendData: spendData || undefined,
      });

      trackEvent("onboarding_quick_profile_complete", {
        has_spending_hints: !!spendData,
        is_first_card: isFirstCard,
      });

      toast.success("Profile created! Let's find your best cards.");
      
      // Navigate to upload
      navigate('/upload', { replace: true });
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setLoading(false);
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
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          {/* Left: Hero */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-heading font-bold">
                help us find your best matches
              </h1>
              <p className="text-lg text-muted-foreground">
                just 3 quick questions. takes 30 seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <TrustBadge icon={Shield} text="Private & Secure" />
              <TrustBadge icon={Zap} text="Quick Setup" />
            </div>

            <p className="text-xs text-muted-foreground">
              We use this only to personalize your recommendations. No credit check. No spam.
            </p>
          </div>

          {/* Right: Form */}
          <Card className="p-8">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }} className="space-y-6">
              {/* Age Range */}
              <div className="space-y-2">
                <Label>
                  Age Range <span className="text-destructive">*</span>
                </Label>
                <SegmentedControl
                  name="age-range"
                  options={AGE_OPTIONS}
                  value={ageRange}
                  onValueChange={setAgeRange}
                />
              </div>

              {/* Income */}
              <div className="space-y-2">
                <Label>
                  Monthly Income <span className="text-destructive">*</span>
                </Label>
                <RadioGrid
                  name="income"
                  options={INCOME_OPTIONS}
                  value={incomeBand}
                  onValueChange={setIncomeBand}
                />
                <p className="text-xs text-muted-foreground">
                  Helps filter cards you're eligible for
                </p>
              </div>

              {/* First Card */}
              <div className="space-y-2">
                <Label>
                  Is this your first credit card? <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={isFirstCard === true ? "default" : "outline"}
                    onClick={() => setIsFirstCard(true)}
                  >
                    Yes - I'll upload bank statements
                  </Button>
                  <Button
                    type="button"
                    variant={isFirstCard === false ? "default" : "outline"}
                    onClick={() => setIsFirstCard(false)}
                  >
                    No - I have credit card statements
                  </Button>
                </div>
              </div>

              {/* City Selection (Optional) */}
              <div className="space-y-2">
                <Label>City (Optional)</Label>
                <CityCombobox value={city} onChange={setCity} />
                <p className="text-xs text-muted-foreground">
                  Helps us find location-specific offers and acceptance
                </p>
              </div>

              {/* Optional Spending Hints */}
              <QuickSpendingHints
                monthlySpend={monthlySpend}
                onMonthlySpendChange={setMonthlySpend}
                topCategories={topCategories}
                onTopCategoriesChange={setTopCategories}
                brands={brands}
                onBrandsChange={setBrands}
              />

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Continue to Upload"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                >
                  Skip
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our Terms and Privacy Policy
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
