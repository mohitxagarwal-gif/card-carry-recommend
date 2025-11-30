import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useDeriveFeatures } from "@/hooks/useDeriveFeatures";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { SpendingSliders } from "@/components/onboarding/SpendingSliders";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SpendSplit {
  online: number;
  dining: number;
  groceries: number;
  travel: number;
  fuel: number;
  bills: number;
  entertainment: number;
  forex: number;
}

export default function OnboardingQuickSpends() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const deriveFeatures = useDeriveFeatures();
  const { createSnapshot } = useRecommendationSnapshot();
  
  const [monthlySpend, setMonthlySpend] = useState(50000);
  const [spendSplit, setSpendSplit] = useState<SpendSplit>({
    online: 0,
    dining: 0,
    groceries: 0,
    travel: 0,
    fuel: 0,
    bills: 0,
    entertainment: 0,
    forex: 0,
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      // Check if basic profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('age_range, income_band_inr')
        .eq('id', user.id)
        .single();
      
      // If missing basic profile, redirect to onboarding start with returnTo
      if (!profile?.age_range || !profile?.income_band_inr) {
        navigate(`/onboarding?returnTo=${encodeURIComponent('/onboarding/quick-spends')}`, { replace: true });
        return;
      }
      
      // Restore from localStorage if exists
      const saved = localStorage.getItem('quickSpends_draft');
      if (saved) {
        try {
          const { monthlySpend: savedSpend, spendSplit: savedSplit } = JSON.parse(saved);
          setMonthlySpend(savedSpend);
          setSpendSplit(savedSplit);
        } catch (e) {
          console.error('Failed to restore saved data:', e);
        }
      }
      
      setUserId(user.id);
      setChecking(false);
    };

    init();
    trackEvent("onboarding.path_selected", { path: "quick_spends" });
  }, [navigate]);

  // Save to localStorage on changes
  useEffect(() => {
    if (userId) {
      localStorage.setItem('quickSpends_draft', JSON.stringify({ monthlySpend, spendSplit }));
    }
  }, [monthlySpend, spendSplit, userId]);

  const handleSubmit = async () => {
    if (!userId) return;
    if (monthlySpend < 5000) {
      toast.error("Please enter a monthly spend of at least ₹5,000");
      return;
    }

    // Validate total percentage
    const total = Object.values(spendSplit).reduce((sum, val) => sum + val, 0);
    if (total < 95 || total > 105) {
      toast.error(`Please adjust percentages to total 100% (currently ${total.toFixed(0)}%)`);
      return;
    }

    setLoading(true);
    try {
      trackEvent("onboarding.quick_spends_completed", {
        monthly_spend: monthlySpend,
        categories: Object.keys(spendSplit).filter(k => spendSplit[k] > 0)
      });

      // Step 1: Mark onboarding as complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Step 2: Derive features from manual input
      console.log("[QuickSpends] Deriving features...");
      await deriveFeatures.mutateAsync({
        userId,
        spendData: {
          monthlySpend,
          spendSplit: { ...spendSplit },
        },
        options: {
          data_source: "self_report",
        },
      });

      // Wait for features to be written
      await new Promise((resolve) => setTimeout(resolve, 200));

      trackEvent("derive_features_called", {
        userId,
        data_source: "self_report",
      });

      // Step 3: Generate recommendations with retry logic
      console.log("[QuickSpends] Generating recommendations...");
      let retries = 3;
      let lastError: any = null;
      let data: any = null;

      while (retries > 0) {
        const { data: responseData, error } = await supabase.functions.invoke(
          "generate-recommendations",
          {
            body: {
              analysisId: null,
              snapshotType: "quick_spends",
            },
          }
        );

        if (!error) {
          data = responseData;
          break;
        }

        lastError = error;
        console.warn(`[QuickSpends] Attempt failed, ${retries - 1} retries left:`, error);
        
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (4 - retries)));
        }
      }

      if (lastError) {
        console.error("[QuickSpends] All retries failed:", lastError);
        throw new Error("Failed to generate recommendations after multiple attempts");
      }

      // Step 4: Create snapshot
      if (data?.recommendations) {
        await createSnapshot({
          analysisId: null,
          savingsMin: 0,
          savingsMax: 50000,
          confidence: "medium",
          recommendedCards: data.recommendations.recommendedCards || [],
          snapshotType: "quick_spends",
        });
      }

      trackEvent("snapshot_created", {
        userId,
        snapshot_type: "quick_spends",
        confidence: data?.confidence || "medium",
      });

      localStorage.removeItem('quickSpends_draft');

      toast.success("Recommendations generated successfully!");
      navigate("/recs?from=onboarding");
    } catch (error: any) {
      console.error("[QuickSpends] Error:", error);
      toast.error(error.message || "Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (checking || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Quick Path - 2 Minutes
            </div>
            <h1 className="text-4xl font-heading font-bold">
              tell us about your spending
            </h1>
            <p className="text-lg text-muted-foreground">
              rough estimates are fine. we'll help you find the best cards.
            </p>
          </div>

          <Card className="p-8 space-y-8">
            {/* Monthly Spend */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">
                  Estimated Monthly Spend
                </Label>
                <div className="text-2xl font-heading font-bold text-primary">
                  ₹{monthlySpend.toLocaleString()}
                </div>
              </div>
              <Slider
                value={[monthlySpend]}
                onValueChange={(val) => setMonthlySpend(val[0])}
                min={5000}
                max={200000}
                step={5000}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Your total credit card spending per month
              </p>
            </div>

            {/* Spending Distribution */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">
                  How do you spend? (adjust percentages)
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const total = Object.values(spendSplit).reduce((sum, val) => sum + val, 0);
                    if (total === 0) return;
                    const factor = 100 / total;
                    const balanced = Object.keys(spendSplit).reduce((acc, key) => {
                      acc[key] = Math.round(spendSplit[key] * factor);
                      return acc;
                    }, {} as SpendSplit);
                    setSpendSplit(balanced);
                    toast.success("Percentages balanced to 100%");
                  }}
                  disabled={Object.values(spendSplit).reduce((sum, val) => sum + val, 0) === 0}
                >
                  Auto-balance to 100%
                </Button>
              </div>
              <SpendingSliders
                spendSplit={spendSplit}
                onChange={setSpendSplit}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Adjust sliders to total 100%. Use auto-balance if needed.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </div>

            {/* Alternative paths */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <Button variant="ghost" size="sm" onClick={() => navigate('/upload')}>
                Upload Statements Instead
              </Button>
              <span className="text-muted-foreground">or</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/onboarding/goal-based')}>
                Try Goal-Based
              </Button>
            </div>
          </Card>

          {/* Why This Works */}
          <Card className="p-6 bg-muted/30">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              How we generate recommendations
            </h3>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes your spending patterns and matches them with 200+
              credit cards to find the best rewards, benefits, and savings for
              your lifestyle. Get personalized recommendations in seconds.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
