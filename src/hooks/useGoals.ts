import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";

interface FeeWaiverGoal {
  id: string;
  user_id: string;
  card_id: string;
  year: number;
  target_amount: number;
  current_amount: number | null;
  created_at: string;
  updated_at: string;
}

export const useGoals = () => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["fee-waiver-goals", currentYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("fee_waiver_goals")
        .select("*")
        .eq("year", currentYear)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FeeWaiverGoal[];
    },
  });

  const createGoal = useMutation({
    mutationFn: async (goalData: {
      card_id: string;
      target_amount: number;
      year?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("fee_waiver_goals")
        .insert({ 
          user_id: user.id, 
          year: goalData.year || currentYear,
          card_id: goalData.card_id,
          target_amount: goalData.target_amount,
          current_amount: 0
        });

      if (error) throw error;
      trackEvent("goal_create", { cardId: goalData.card_id, target: goalData.target_amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-waiver-goals"] });
      toast.success("Goal created successfully");
    },
    onError: () => {
      toast.error("Failed to create goal");
    },
  });

  const updateProgress = useMutation({
    mutationFn: async ({ id, currentAmount }: { id: string; currentAmount: number }) => {
      const { error } = await supabase
        .from("fee_waiver_goals")
        .update({ current_amount: currentAmount })
        .eq("id", id);

      if (error) throw error;
      trackEvent("goal_update", { goalId: id, amount: currentAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-waiver-goals"] });
      toast.success("Progress updated");
    },
    onError: () => {
      toast.error("Failed to update progress");
    },
  });

  const calculateProgress = (goal: FeeWaiverGoal): number => {
    if (!goal.current_amount || goal.target_amount === 0) return 0;
    return Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  };

  const getGoalByCardId = (cardId: string, year?: number): FeeWaiverGoal | undefined => {
    return goals.find((goal) => 
      goal.card_id === cardId && goal.year === (year || currentYear)
    );
  };

  return {
    goals,
    isLoading,
    createGoal: createGoal.mutate,
    updateProgress: updateProgress.mutate,
    calculateProgress,
    getGoalByCardId,
  };
};
