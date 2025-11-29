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
  const deriveFeatures = useDeriveFeatures();
  const { createSnapshot } = useRecommendationSnapshot();
  
  const [monthlySpend, setMonthlySpend] = useState(50000);
  const [spendSplit, setSpendSplit] = useState<SpendSplit>({
    online: 20,
    dining: 15,
    groceries: 20,
    travel: 5,
    fuel: 10,
    bills: 10,
    entertainment: 10,
    forex: 10,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };

    checkAuth();
    trackEvent("onboarding.path_selected", { path: "quick_spends" });
  }, [navigate]);

  const handleSubmit = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Step 1: Derive features from manual input
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

      trackEvent("derive_features_called", {
        userId,
        data_source: "self_report",
      });

      // Step 2: Generate recommendations
      const { data, error } = await supabase.functions.invoke(
        "generate-recommendations",
        {
          body: {
            userId,
            snapshotType: "quick_spends",
          },
        }
      );

      if (error) throw error;

      trackEvent("snapshot_created", {
        userId,
        snapshot_type: "quick_spends",
        confidence: data.confidence || "medium",
      });

      toast.success("Recommendations generated successfully!");
      navigate("/recs");
    } catch (error: any) {
      console.error("QuickSpends error:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
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
              <Label className="text-lg font-semibold">
                How do you spend? (adjust percentages)
              </Label>
              <SpendingSliders
                spendSplit={spendSplit}
                onChange={setSpendSplit}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Focus on your top 3-4 categories. Small spending doesn't
                need to be precise.
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
              <Button
                variant="ghost"
                onClick={() => navigate("/upload")}
                disabled={loading}
              >
                Upload Statements Instead
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
