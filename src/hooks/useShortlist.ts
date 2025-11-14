import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserShortlist } from "@/types/dashboard";
import { toast } from "sonner";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";

export const useShortlist = () => {
  const queryClient = useQueryClient();

  const { data: shortlist = [], isLoading } = useQuery({
    queryKey: ["user-shortlist"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_shortlist")
        .select("*")
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data as UserShortlist[];
    },
  });

  const addToShortlist = useMutation({
    mutationFn: async (cardId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_shortlist")
        .insert({ user_id: user.id, card_id: cardId });

      if (error) throw error;
      trackEvent("recs_shortlist_add", { cardId });
    },
    onMutate: async (cardId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["user-shortlist"] });
      const previousShortlist = queryClient.getQueryData(["user-shortlist"]);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        queryClient.setQueryData(["user-shortlist"], (old: UserShortlist[] = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`,
            user_id: user.id,
            card_id: cardId,
            added_at: new Date().toISOString()
          }
        ]);
      }

      return { previousShortlist };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shortlist"] });
      toast.success("Added to shortlist");
    },
    onError: (error: any, cardId, context) => {
      // Revert optimistic update on error
      if (context?.previousShortlist) {
        queryClient.setQueryData(["user-shortlist"], context.previousShortlist);
      }
      
      if (error.message?.includes("duplicate")) {
        toast.info("Already in your shortlist");
      } else if (!navigator.onLine) {
        const { addToQueue } = require("@/lib/offlineQueue");
        addToQueue({
          type: 'shortlist_add',
          payload: { cardId }
        });
        toast.info("Saved locally—will sync when online");
      } else {
        toast.error("Failed to add to shortlist");
      }
    },
  });

  const removeFromShortlist = useMutation({
    mutationFn: async (cardId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_shortlist")
        .delete()
        .eq("user_id", user.id)
        .eq("card_id", cardId);

      if (error) throw error;
      trackEvent("recs_shortlist_remove", { cardId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shortlist"] });
      toast.success("Removed from shortlist");
    },
    onError: () => {
      toast.error("Failed to remove from shortlist");
    },
  });

  const isInShortlist = (cardId: string) => {
    return shortlist.some((item) => item.card_id === cardId);
  };

  return {
    shortlist,
    isLoading,
    addToShortlist: addToShortlist.mutate,
    removeFromShortlist: removeFromShortlist.mutate,
    isInShortlist,
  };
};
