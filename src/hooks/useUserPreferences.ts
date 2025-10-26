import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPreferences } from "@/types/dashboard";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

export const useUserPreferences = () => {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserPreferences | null;
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (preferences) {
        const { error } = await supabase
          .from("user_preferences")
          .update(updates)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_preferences")
          .insert({ ...updates, user_id: user.id });

        if (error) throw error;
      }

      trackEvent("profile_update", { fields: Object.keys(updates) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
      toast.success("Preferences updated");
    },
    onError: () => {
      toast.error("Failed to update preferences");
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferences.mutate,
  };
};
