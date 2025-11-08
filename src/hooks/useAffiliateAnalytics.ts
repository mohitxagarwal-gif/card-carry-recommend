import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAffiliatePerformance = () => {
  return useQuery({
    queryKey: ["analytics", "affiliate-performance"],
    queryFn: async () => {
      const { data: clicks, error } = await supabase
        .from("affiliate_clicks")
        .select("card_id, clicked_at");

      if (error) throw error;
      if (!clicks) return { totalClicks: 0, last30Days: 0, topCards: [] };

      const totalClicks = clicks.length;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const last30Days = clicks.filter(
        (c) => new Date(c.clicked_at) >= thirtyDaysAgo
      ).length;

      const cardClickCount: Record<string, number> = {};
      clicks.forEach((c) => {
        cardClickCount[c.card_id] = (cardClickCount[c.card_id] || 0) + 1;
      });

      const { data: cards } = await supabase
        .from("credit_cards")
        .select("card_id, name, affiliate_partner, affiliate_commission_rate")
        .eq("is_active", true);

      const topCards = Object.entries(cardClickCount)
        .map(([cardId, clicks]) => {
          const card = cards?.find((c) => c.card_id === cardId);
          return {
            cardId,
            name: card?.name || cardId,
            clicks,
            partner: card?.affiliate_partner,
            commissionRate: card?.affiliate_commission_rate,
            estimatedRevenue: card?.affiliate_commission_rate
              ? clicks * (card.affiliate_commission_rate / 100) * 1000
              : 0,
          };
        })
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      return { totalClicks, last30Days, topCards };
    },
    staleTime: 2 * 60 * 1000,
  });
};
