import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  opened_month: string | null;
  renewal_month: string | null;
  forex_pct: number | null;
  lounge_quota_total: number | null;
  lounge_used: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export const useUserCards = () => {
  const queryClient = useQueryClient();

  const { data: userCards = [], isLoading } = useQuery({
    queryKey: ["user-cards"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_cards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserCard[];
    },
  });

  const addCard = useMutation({
    mutationFn: async (cardData: {
      card_id: string;
      opened_month?: string;
      renewal_month?: string;
      forex_pct?: number;
      lounge_quota_total?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_cards")
        .insert({ 
          user_id: user.id, 
          ...cardData,
          lounge_used: 0,
          is_active: true
        });

      if (error) throw error;
      trackEvent("user_card_add", { cardId: cardData.card_id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cards"] });
      toast.success("Card added successfully");
    },
    onError: () => {
      toast.error("Failed to add card");
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Omit<UserCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>> 
    }) => {
      const { error } = await supabase
        .from("user_cards")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      trackEvent("user_card_update", { cardId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cards"] });
      toast.success("Card updated");
    },
    onError: () => {
      toast.error("Failed to update card");
    },
  });

  const closeCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_cards")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      trackEvent("user_card_close", { cardId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-cards"] });
      toast.success("Card marked as closed");
    },
    onError: () => {
      toast.error("Failed to close card");
    },
  });

  const getActiveCards = () => {
    return userCards.filter((card) => card.is_active);
  };

  const getCardByCardId = (cardId: string) => {
    return userCards.find((card) => card.card_id === cardId);
  };

  return {
    userCards,
    isLoading,
    addCard: addCard.mutate,
    updateCard: updateCard.mutate,
    closeCard: closeCard.mutate,
    getActiveCards,
    getCardByCardId,
  };
};
