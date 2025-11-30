import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Target, Plane, ShoppingBag, Utensils, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useDeriveFeatures } from "@/hooks/useDeriveFeatures";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { cn } from "@/lib/utils";
import { GoalQuestionModal } from "@/components/onboarding/GoalQuestionModal";
import { CustomGoalChat } from "@/components/onboarding/CustomGoalChat";
import { CardLoadingScreen } from "@/components/CardLoadingScreen";

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
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCustomChat, setShowCustomChat] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<GoalPreset | null>(null);
  const deriveFeatures = useDeriveFeatures();
  const { createSnapshot } = useRecommendationSnapshot();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      
      // Check if basic profile exists and onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('age_range, income_band_inr, onboarding_completed')
        .eq('id', user.id)
        .single();
      
      // If onboarding already completed, check if snapshot exists
      if (profile?.onboarding_completed) {
        console.log('[Goal-Based] Onboarding completed, checking for snapshot...');
        
        const { data: snapshot } = await supabase
          .from('recommendation_snapshots')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        
        if (snapshot) {
          console.log('[Goal-Based] Snapshot exists, redirecting to /recs');
          navigate('/recs', { replace: true });
          return;
        }
        
        // Completed but no snapshot - allow retry
        console.warn('[Goal-Based] Onboarding completed but no snapshot - user in broken state, allowing retry');
        toast.info("Let's regenerate your recommendations");
      }
      
      // If missing basic profile, redirect to onboarding start with returnTo
      if (!profile?.age_range || !profile?.income_band_inr) {
        navigate(`/onboarding?returnTo=${encodeURIComponent('/onboarding/goal-based')}`, { replace: true });
        return;
      }
      
      setUserId(user.id);
      setChecking(false);

      // Restore progress if exists
      const saved = localStorage.getItem(`goalpick_progress_${user.id}`);
      if (saved) {
        try {
          const { step, timestamp } = JSON.parse(saved);
          // Only restore if less than 30 minutes old
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            console.log('[Goal-Based] Restored progress:', step);
          } else {
            localStorage.removeItem(`goalpick_progress_${user.id}`);
          }
        } catch (e) {
          console.error('Error restoring progress:', e);
          localStorage.removeItem(`goalpick_progress_${user.id}`);
        }
      }
    };

    init();
    trackEvent("onboarding.path_selected", { path: "goal_based" });
  }, [navigate]);

  const handleGoalSelect = (preset: GoalPreset) => {
    if (!userId) return;
    setCurrentPreset(preset);
    setShowQuestionModal(true);
    
    // Save progress
    localStorage.setItem(`goalpick_progress_${userId}`, JSON.stringify({
      step: 'goal_selected',
      goalId: preset.id,
      timestamp: Date.now()
    }));
  };

  const handleCustomGoalSelect = () => {
    if (!userId) return;
    setShowCustomChat(true);
    
    // Save progress
    localStorage.setItem(`goalpick_progress_${userId}`, JSON.stringify({
      step: 'custom_goal',
      timestamp: Date.now()
    }));
  };

  const processGoalRecommendations = async (
    goalData: {
      monthlySpend: number;
      spendSplit: Record<string, number>;
      customWeights?: Record<string, number>;
      goalDescription?: string;
    },
    preset?: GoalPreset
  ) => {
    if (!userId) return;

    const weights = goalData.customWeights || preset?.customWeights || {};
    const goalId = preset?.id || "custom_goal";
    const goalTitle = preset?.title || goalData.goalDescription || "Custom Goal";

    setSelectedGoal(goalId);
    setLoading(true);

    try {
      console.log('[Goal-Based] === STARTING RECOMMENDATION GENERATION ===');
      console.log('[Goal-Based] Goal:', { goalId, goalTitle });
      console.log('[Goal-Based] Monthly spend:', goalData.monthlySpend);
      
      // Save "in progress" flag to localStorage for recovery
      localStorage.setItem(`generating_recommendations_${userId}`, JSON.stringify({
        started_at: Date.now(),
        flow: 'goal_based',
        goal: goalId
      }));
      
      trackEvent("onboarding.goal_selected", {
        goal_id: goalId,
        goal_title: goalTitle,
      });

      // Step 1: Derive features
      console.log("[Goal-Based] Step 1: Deriving features...");
      await deriveFeatures.mutateAsync({
        userId,
        spendData: {
          monthlySpend: goalData.monthlySpend,
          spendSplit: goalData.spendSplit,
        },
        options: {
          data_source: "goal_based",
          custom_weights: weights,
        },
      });
      console.log("[Goal-Based] ✓ Features derived");

      trackEvent("derive_features_called", {
        userId,
        data_source: "goal_based",
        goal: goalId,
      });

      // Step 2: Generate recommendations
      console.log("[Goal-Based] Step 2: Generating recommendations...");
      const { data, error } = await supabase.functions.invoke(
        "generate-recommendations",
        {
          body: {
            analysisId: null,
            customWeights: weights,
            snapshotType: "goal_based",
          },
        }
      );

      if (error) {
        console.error("[Goal-Based] Recommendation generation error:", error);
        throw new Error(error.message || "Failed to generate recommendations");
      }

      if (!data?.recommendations) {
        console.error("[Goal-Based] No recommendations in response:", data);
        throw new Error("No recommendations returned from server");
      }
      
      console.log("[Goal-Based] ✓ Recommendations generated, count:", data.recommendations.recommendedCards?.length || 0);

      // Step 3: Create snapshot
      console.log("[Goal-Based] Step 3: Creating snapshot...");
      const snapshot = await createSnapshot({
        analysisId: null,
        savingsMin: 0,
        savingsMax: 50000,
        confidence: "medium",
        recommendedCards: data.recommendations.recommendedCards || [],
        snapshotType: "goal_based",
      });
      
      if (!snapshot) {
        throw new Error("Failed to create snapshot");
      }
      console.log("[Goal-Based] ✓ Snapshot created:", snapshot.id);

      trackEvent("snapshot_created", {
        userId,
        snapshot_type: "goal_based",
        goal: goalId,
        confidence: data?.confidence || "medium",
      });

      // Step 4: NOW mark onboarding as complete (AFTER snapshot)
      console.log("[Goal-Based] Step 4: Marking onboarding complete...");
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        console.error("[Goal-Based] Profile update failed:", profileError);
        throw profileError;
      }
      console.log("[Goal-Based] ✓ Onboarding marked complete");

      // Clear saved progress and generating flag
      console.log("[Goal-Based] Clearing saved progress...");
      if (userId) {
        localStorage.removeItem(`goalpick_progress_${userId}`);
        localStorage.removeItem(`generating_recommendations_${userId}`);
      }
      
      // Close modal and reset states BEFORE navigation
      console.log("[Goal-Based] Resetting UI states...");
      setLoading(false);
      setSelectedGoal(null);
      setShowQuestionModal(false);
      setShowCustomChat(false);
      
      // Show success message
      toast.success(`Recommendations tailored for ${goalTitle}!`);
      
      // Force refresh auth session cache
      console.log("[Goal-Based] Refreshing auth cache...");
      queryClient.invalidateQueries({ queryKey: ['auth-session'] });
      
      // Small delay for state updates to propagate
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Navigate
      console.log("[Goal-Based] === NAVIGATING TO RECOMMENDATIONS ===");
      navigate("/recs?from=onboarding", { replace: true });
      
    } catch (error: any) {
      console.error("[Goal-Based] === ERROR ===", error);
      const errorMessage = error.message || "Failed to generate recommendations. Please try again.";
      toast.error(errorMessage);
      
      // Clear generating flag on error
      if (userId) {
        localStorage.removeItem(`generating_recommendations_${userId}`);
      }
      
      trackEvent("goal_based.error", {
        userId,
        goal: goalId,
        error: errorMessage,
      });
      
      // Reset states on error
      setLoading(false);
      setSelectedGoal(null);
      setShowQuestionModal(false);
      setShowCustomChat(false);
    }
  };

  if (checking || !userId) {
    return (
      <CardLoadingScreen
        message="Crafting your goals..."
        variant="fullPage"
      />
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

            {/* Custom Goal Card */}
            <Card
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 border-dashed",
                selectedGoal === "custom_goal" && "border-primary shadow-lg"
              )}
              onClick={() => !loading && handleCustomGoalSelect()}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      Custom Goal - Chat with AI
                    </CardTitle>
                    <CardDescription>
                      Tell us your unique spending habits and priorities
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI will ask you a few questions to understand your needs and find the perfect cards for you.
                </p>
                {selectedGoal === "custom_goal" && loading && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating recommendations...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modals */}
          {currentPreset && (
            <GoalQuestionModal
              open={showQuestionModal}
              goalId={currentPreset.id}
              goalTitle={currentPreset.title}
              defaultSpend={currentPreset.estimatedSpend}
              loading={loading}
              onComplete={(data) =>
                processGoalRecommendations(data, currentPreset)
              }
              onCancel={() => {
                setShowQuestionModal(false);
                setCurrentPreset(null);
              }}
            />
          )}

          <CustomGoalChat
            open={showCustomChat}
            onComplete={(data) => processGoalRecommendations(data)}
            onCancel={() => setShowCustomChat(false)}
          />

          {/* Alternative Options */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Want more accurate recommendations?
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Button variant="ghost" size="sm" onClick={() => navigate('/onboarding/quick-spends')} disabled={loading}>
                Try QuickSpends
              </Button>
              <span className="text-muted-foreground">or</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/upload')} disabled={loading}>
                SmartScan Upload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
