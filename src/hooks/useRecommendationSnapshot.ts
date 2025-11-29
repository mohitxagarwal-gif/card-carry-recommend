import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecommendationSnapshot } from "@/types/dashboard";
import { toast } from "sonner";
import type { RecommendationCardInsert } from "@/types/supabase-extended";

export const useRecommendationSnapshot = () => {
  const queryClient = useQueryClient();

  const { data: latestSnapshot, isLoading } = useQuery({
    queryKey: ["latest-recommendation-snapshot"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("recommendation_snapshots")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as RecommendationSnapshot | null;
    },
  });

  const createSnapshot = useMutation({
    mutationFn: async ({
      analysisId,
      savingsMin,
      savingsMax,
      confidence,
      recommendedCards,
      snapshotType,
    }: {
      analysisId: string | null;
      savingsMin: number;
      savingsMax: number;
      confidence: 'low' | 'medium' | 'high';
      recommendedCards: any[];
      snapshotType?: 'statement_based' | 'quick_spends' | 'goal_based';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert the snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from("recommendation_snapshots")
        .insert({
          user_id: user.id,
          analysis_id: analysisId,
          savings_min: savingsMin,
          savings_max: savingsMax,
          confidence,
          recommended_cards: recommendedCards,
          snapshot_type: snapshotType || 'statement_based',
        })
        .select()
        .single();

      if (snapshotError) throw snapshotError;

      // PHASE 1B: Also write to normalized recommendation_cards table
      if (snapshot && recommendedCards && recommendedCards.length > 0) {
        const cardsForInsert: RecommendationCardInsert[] = recommendedCards.map((card, index) => ({
          user_id: user.id,
          snapshot_id: snapshot.id,
          card_id: card.card_id || card.cardId,
          rank: index + 1,
          match_score: card.matchScore || card.score || 0,
          estimated_annual_value_inr: card.estimatedAnnualValue || card.estimated_annual_value || null,
          confidence: confidence,
          reasoning: card.reasoning || null,
          benefits_matched: card.benefitsMatched || card.benefits_matched || {},
          top_categories: card.topCategories || card.top_categories || [],
          warnings: card.warnings || [],
          eligibility_notes: card.eligibilityNotes || card.eligibility_notes || null,
        }));

        const { error: cardsError } = await supabase
          .from("recommendation_cards" as any)
          .insert(cardsForInsert);

        if (cardsError) {
          console.error('[useRecommendationSnapshot] Error writing normalized cards:', cardsError);
          // Don't fail the whole operation if normalized table insert fails
        }
      }

      return snapshot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latest-recommendation-snapshot"] });
      queryClient.invalidateQueries({ queryKey: ["recommendation-cards"] });
    },
    onError: () => {
      toast.error("Failed to save recommendations");
    },
  });

  const refreshRecommendations = useMutation({
    mutationFn: async (params: { analysisId?: string | null; customWeights?: Record<string, number>; snapshotType?: string } = {}) => {
      const { analysisId, customWeights, snapshotType } = params;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let transactions = undefined;
      
      // Fetch the analysis data if analysisId provided
      if (analysisId) {
        const { data: analysis, error: analysisError } = await supabase
          .from('spending_analyses')
          .select('analysis_data')
          .eq('id', analysisId)
          .single();

        if (analysisError) throw analysisError;
        
        const analysisData = analysis?.analysis_data as any;
        if (!analysisData?.transactions) {
          throw new Error("No transaction data found in analysis");
        }
        transactions = analysisData.transactions;
      }

      // Fetch user profile and preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('age_range, income_band_inr, city')
        .eq('id', user.id)
        .maybeSingle();

      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('fee_sensitivity, travel_frequency, lounge_importance, preference_type')
        .eq('user_id', user.id)
        .maybeSingle();

      // Call edge function with transactions and updated preferences
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          analysisId: analysisId || null,
          transactions,
          profile: profile || undefined,
          preferences: preferences || undefined,
          customWeights,
          snapshotType
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latest-recommendation-snapshot"] });
      toast.success("Recommendations refreshed successfully!");
    },
    onError: (error) => {
      console.error("Failed to refresh recommendations:", error);
      toast.error("Failed to refresh recommendations");
    },
  });

  return {
    latestSnapshot,
    isLoading,
    createSnapshot: createSnapshot.mutate,
    refreshRecommendations: refreshRecommendations.mutate,
    isRefreshing: refreshRecommendations.isPending,
  };
};
