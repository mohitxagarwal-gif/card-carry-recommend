import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target, Plane, ShoppingBag, Utensils, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useDeriveFeatures } from "@/hooks/useDeriveFeatures";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { cn } from "@/lib/utils";

interface GoalPreset {
  id: string;
  icon: any;
  title: string;
  description: string;
  customWeights: Record<string, number>;
  estimatedSpend: number;
  spendSplit: Record<string, number>;
}

const GOAL_PRESETS: GoalPreset[] = [
  {
    id: "travel_maximizer",
    icon: Plane,
    title: "Maximize Travel Rewards",
    description: "Perfect for frequent travelers. Prioritize lounge access, miles, and travel benefits.",
    customWeights: {
      travelFit: 0.40,
      rewardRelevance: 0.25,
      feeAffordability: 0.15,
      categoryAlignment: 0.15,
      networkAcceptance: 0.05,
    },
    estimatedSpend: 60000,
    spendSplit: {
      travel: 30,
      dining: 20,
      online: 20,
      groceries: 15,
      fuel: 10,
      other: 5,
    },
  },
  {
    id: "shopping_optimizer",
    icon: ShoppingBag,
    title: "Optimize Shopping Rewards",
    description: "Best for online shopping enthusiasts. Maximize cashback on e-commerce and retail.",
    customWeights: {
      categoryAlignment: 0.35,
      rewardRelevance: 0.30,
      feeAffordability: 0.20,
      travelFit: 0.10,
      networkAcceptance: 0.05,
    },
    estimatedSpend: 50000,
    spendSplit: {
      online: 40,
      groceries: 20,
      dining: 15,
      entertainment: 10,
      fuel: 10,
      other: 5,
    },
  },
  {
    id: "dining_rewards",
    icon: Utensils,
    title: "Dining & Entertainment Focus",
    description: "Ideal for foodies and social butterflies. Top rewards on restaurants and lifestyle.",
    customWeights: {
      categoryAlignment: 0.35,
      rewardRelevance: 0.30,
      feeAffordability: 0.20,
      travelFit: 0.10,
      networkAcceptance: 0.05,
    },
    estimatedSpend: 45000,
    spendSplit: {
      dining: 35,
      entertainment: 20,
      online: 15,
      groceries: 15,
      fuel: 10,
      other: 5,
    },
  },
  {
    id: "balanced_rewards",
    icon: Sparkles,
    title: "Balanced All-Rounder",
    description: "Diversified spending with focus on overall value and flexibility.",
    customWeights: {
      rewardRelevance: 0.25,
      categoryAlignment: 0.25,
      feeAffordability: 0.20,
      travelFit: 0.15,
      networkAcceptance: 0.10,
      loyaltyPotential: 0.05,
    },
    estimatedSpend: 50000,
    spendSplit: {
      online: 20,
      dining: 15,
      groceries: 20,
      travel: 10,
      fuel: 10,
      entertainment: 10,
      other: 15,
    },
  },
];

export default function OnboardingGoalBased() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const deriveFeatures = useDeriveFeatures();
  const { createSnapshot } = useRecommendationSnapshot();

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
    trackEvent("onboarding.path_selected", { path: "goal_based" });
  }, [navigate]);

  const handleGoalSelect = async (preset: GoalPreset) => {
    if (!userId) return;

    setSelectedGoal(preset.id);
    setLoading(true);

    try {
      // Step 1: Mark onboarding as complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Step 2: Derive features with goal-based weights
      await deriveFeatures.mutateAsync({
        userId,
        spendData: {
          monthlySpend: preset.estimatedSpend,
          spendSplit: preset.spendSplit,
        },
        options: {
          data_source: "goal_based",
          custom_weights: preset.customWeights,
        },
      });

      trackEvent("derive_features_called", {
        userId,
        data_source: "goal_based",
        goal: preset.id,
      });

      // Step 3: Generate recommendations with custom weights (no analysisId for manual flows)
      const { data, error } = await supabase.functions.invoke(
        "generate-recommendations",
        {
          body: {
            analysisId: null,
            customWeights: preset.customWeights,
            snapshotType: "goal_based",
          },
        }
      );

      if (error) throw error;

      // Step 4: Create snapshot
      if (data?.recommendations) {
        createSnapshot({
          analysisId: null,
          savingsMin: 0,
          savingsMax: 50000,
          confidence: "medium",
          recommendedCards: data.recommendations.recommendedCards || [],
          snapshotType: "goal_based",
        });
      }

      trackEvent("snapshot_created", {
        userId,
        snapshot_type: "goal_based",
        goal: preset.id,
        confidence: data?.confidence || "medium",
      });

      toast.success(`Recommendations tailored for ${preset.title}!`);
      navigate("/recs");
    } catch (error: any) {
      console.error("Goal-based error:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setLoading(false);
      setSelectedGoal(null);
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
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Target className="w-4 h-4" />
              Goal-Based Path - 10 Seconds
            </div>
            <h1 className="text-4xl font-heading font-bold">
              what's your main goal?
            </h1>
            <p className="text-lg text-muted-foreground">
              choose a preset to get instant recommendations tailored to your priority
            </p>
          </div>

          {/* Goal Presets Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {GOAL_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedGoal === preset.id;

              return (
                <Card
                  key={preset.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
                    isSelected && "border-primary shadow-lg"
                  )}
                  onClick={() => !loading && handleGoalSelect(preset)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {preset.title}
                        </CardTitle>
                        <CardDescription>{preset.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Est. Monthly Spend:</span>
                        <span className="font-medium text-foreground">
                          ₹{preset.estimatedSpend.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Top Category:</span>
                        <span className="font-medium text-foreground">
                          {Object.entries(preset.spendSplit).sort(
                            ([, a], [, b]) => b - a
                          )[0][0]}
                        </span>
                      </div>
                    </div>

                    {isSelected && loading && (
                      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating recommendations...
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Alternative Options */}
          <div className="flex gap-4 justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => navigate("/onboarding/quick-spends")}
              disabled={loading}
            >
              Enter Spending Manually
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/upload")}
              disabled={loading}
            >
              Upload Statements
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
