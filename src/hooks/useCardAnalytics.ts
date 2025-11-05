import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCardPerformance = () => {
  return useQuery({
    queryKey: ["analytics", "card-performance"],
    queryFn: async () => {
      const { data: cards, error } = await supabase
        .from("credit_cards")
        .select("card_id, name, issuer, category_badges, annual_fee")
        .eq("is_active", true);

      if (error) throw error;

      const cardPerformance = await Promise.all(
        cards.map(async (card) => {
          const [shortlist, applications, userCards] = await Promise.all([
            supabase.from("user_shortlist").select("id", { count: "exact", head: true }).eq("card_id", card.card_id),
            supabase.from("card_applications").select("id", { count: "exact", head: true }).eq("card_id", card.card_id),
            supabase.from("user_cards").select("id", { count: "exact", head: true }).eq("card_id", card.card_id),
          ]);

          const shortlistCount = shortlist.count || 0;
          const applicationCount = applications.count || 0;
          const conversionRate = shortlistCount > 0 ? (applicationCount / shortlistCount) * 100 : 0;

          return {
            cardId: card.card_id,
            name: card.name,
            issuer: card.issuer,
            categories: card.category_badges,
            annualFee: card.annual_fee,
            shortlistCount,
            applicationCount,
            ownedCount: userCards.count || 0,
            conversionRate,
          };
        })
      );

      return cardPerformance.sort((a, b) => b.shortlistCount - a.shortlistCount);
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCategoryPerformance = () => {
  return useQuery({
    queryKey: ["analytics", "category-performance"],
    queryFn: async () => {
      const { data: cards, error } = await supabase
        .from("credit_cards")
        .select("card_id, category_badges")
        .eq("is_active", true);

      if (error) throw error;

      const categoryMap = new Map<string, { shortlists: number; applications: number }>();

      await Promise.all(
        cards.map(async (card) => {
          const [shortlist, applications] = await Promise.all([
            supabase.from("user_shortlist").select("id", { count: "exact", head: true }).eq("card_id", card.card_id),
            supabase.from("card_applications").select("id", { count: "exact", head: true }).eq("card_id", card.card_id),
          ]);

          card.category_badges.forEach(category => {
            const current = categoryMap.get(category) || { shortlists: 0, applications: 0 };
            categoryMap.set(category, {
              shortlists: current.shortlists + (shortlist.count || 0),
              applications: current.applications + (applications.count || 0),
            });
          });
        })
      );

      return Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        shortlists: data.shortlists,
        applications: data.applications,
      }));
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useIssuerPerformance = () => {
  return useQuery({
    queryKey: ["analytics", "issuer-performance"],
    queryFn: async () => {
      const { data: applications, error } = await supabase
        .from("card_applications")
        .select("card_id");

      if (error) throw error;

      const { data: cards, error: cardsError } = await supabase
        .from("credit_cards")
        .select("card_id, issuer");

      if (cardsError) throw cardsError;

      const issuerMap = new Map<string, number>();
      applications.forEach(app => {
        const card = cards.find(c => c.card_id === app.card_id);
        if (card) {
          issuerMap.set(card.issuer, (issuerMap.get(card.issuer) || 0) + 1);
        }
      });

      return Array.from(issuerMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    staleTime: 2 * 60 * 1000,
  });
};
