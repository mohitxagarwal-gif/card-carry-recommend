import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecommendationSnapshot } from "@/types/dashboard";
import { toast } from "sonner";

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
    }: {
      analysisId: string | null;
      savingsMin: number;
      savingsMax: number;
      confidence: 'low' | 'medium' | 'high';
      recommendedCards: any[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("recommendation_snapshots")
        .insert({
          user_id: user.id,
          analysis_id: analysisId,
          savings_min: savingsMin,
          savings_max: savingsMax,
          confidence,
          recommended_cards: recommendedCards,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latest-recommendation-snapshot"] });
    },
    onError: () => {
      toast.error("Failed to save recommendations");
    },
  });

  const refreshRecommendations = useMutation({
    mutationFn: async (analysisId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch the analysis data which contains transactions
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
          transactions: analysisData.transactions,
          profile: profile || undefined,
          preferences: preferences || undefined
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
