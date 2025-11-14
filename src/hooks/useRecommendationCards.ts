import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecommendationCard {
  id: string;
  user_id: string;
  snapshot_id: string;
  card_id: string;
  rank: number;
  match_score: number;
  estimated_annual_value_inr: number | null;
  confidence: 'low' | 'medium' | 'high' | null;
  reasoning: string | null;
  benefits_matched: Record<string, any>;
  top_categories: string[];
  warnings: string[];
  eligibility_notes: string | null;
  created_at: string;
}

/**
 * Hook to fetch normalized recommendation cards for a specific snapshot
 * This replaces parsing recommended_cards from JSONB
 */
export const useRecommendationCards = (snapshotId: string | null) => {
  return useQuery({
    queryKey: ["recommendation-cards", snapshotId],
    queryFn: async () => {
      if (!snapshotId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("recommendation_cards")
        .select("*")
        .eq("snapshot_id", snapshotId)
        .order("rank", { ascending: true });

      if (error) throw error;
      return (data || []) as RecommendationCard[];
    },
    enabled: !!snapshotId,
  });
};

/**
 * Hook to fetch latest recommendation cards for current user
 * Gets cards from the most recent snapshot
 */
export const useLatestRecommendationCards = () => {
  return useQuery({
    queryKey: ["latest-recommendation-cards"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get latest snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from("recommendation_snapshots")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (snapshotError) throw snapshotError;
      if (!snapshot) return [];

      // Get cards for this snapshot
      const { data, error } = await supabase
        .from("recommendation_cards")
        .select("*")
        .eq("snapshot_id", snapshot.id)
        .order("rank", { ascending: true });

      if (error) throw error;
      return (data || []) as RecommendationCard[];
    },
  });
};

/**
 * Hook to get all recommendations for a specific card across snapshots
 * Useful for tracking how a card's ranking changes over time
 */
export const useCardRecommendationHistory = (cardId: string | null) => {
  return useQuery({
    queryKey: ["card-recommendation-history", cardId],
    queryFn: async () => {
      if (!cardId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("recommendation_cards")
        .select(`
          *,
          recommendation_snapshots!inner(
            created_at,
            confidence
          )
        `)
        .eq("card_id", cardId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!cardId,
  });
};

/**
 * Hook to get top recommended cards by match score
 * Useful for quick access to best matches
 */
export const useTopRecommendedCards = (limit: number = 5) => {
  return useQuery({
    queryKey: ["top-recommended-cards", limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get latest snapshot
      const { data: snapshot, error: snapshotError } = await supabase
        .from("recommendation_snapshots")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (snapshotError) throw snapshotError;
      if (!snapshot) return [];

      // Get top cards by match score
      const { data, error } = await supabase
        .from("recommendation_cards")
        .select("*")
        .eq("snapshot_id", snapshot.id)
        .order("match_score", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as RecommendationCard[];
    },
  });
};
