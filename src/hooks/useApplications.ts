import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CardApplication } from "@/types/dashboard";
import { toast } from "sonner";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { trackEvent as trackMixpanelEvent } from "@/lib/analytics";

export const useApplications = () => {
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["card-applications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("card_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CardApplication[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ 
      cardId, 
      status 
    }: { 
      cardId: string; 
      status: CardApplication['status'] 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find existing application
      const existing = applications.find(app => app.card_id === cardId);

      if (existing) {
        const { error } = await supabase
          .from("card_applications")
          .update({ 
            status, 
            status_updated_at: new Date().toISOString(),
            applied_date: status === 'applied' && !existing.applied_date 
              ? new Date().toISOString() 
              : existing.applied_date
          })
          .eq("id", existing.id);

        if (error) throw error;
        trackEvent("apps_status_update", { cardId, from: existing.status, to: status });
      } else {
        const { error } = await supabase
          .from("card_applications")
          .insert({ 
            user_id: user.id, 
            card_id: cardId, 
            status,
            applied_date: status === 'applied' ? new Date().toISOString() : null
          });

        if (error) throw error;
        trackEvent("apps_status_update", { cardId, from: 'none', to: status });
      }
    },
    onMutate: async ({ cardId, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["card-applications"] });
      const previousApps = queryClient.getQueryData(["card-applications"]);
      
      queryClient.setQueryData(["card-applications"], (old: CardApplication[] = []) => {
        const existing = old.find(app => app.card_id === cardId);
        if (existing) {
          return old.map(app => 
            app.card_id === cardId 
              ? { ...app, status, status_updated_at: new Date().toISOString() }
              : app
          );
        }
        return old;
      });

      return { previousApps };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["card-applications"] });
      
      // Mixpanel event
      trackMixpanelEvent('application.status_updated', {
        cardId: variables.cardId,
        newStatus: variables.status,
      });
      
      toast.success("Status updated");
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousApps) {
        queryClient.setQueryData(["card-applications"], context.previousApps);
      }
      
      // Check if offline
      if (!navigator.onLine) {
        const { addToQueue } = require("@/lib/offlineQueue");
        addToQueue({
          type: 'status_update',
          payload: { cardId: variables.cardId, status: variables.status }
        });
        toast.info("Saved locally—will sync when online");
      } else {
        toast.error("Failed to update status");
      }
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("card_applications")
        .update({ notes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-applications"] });
      toast.success("Notes saved");
    },
    onError: () => {
      toast.error("Failed to save notes");
    },
  });

  const getApplicationStatus = (cardId: string): CardApplication['status'] | null => {
    const app = applications.find(a => a.card_id === cardId);
    return app?.status || null;
  };

  return {
    applications,
    isLoading,
    updateStatus: updateStatus.mutate,
    updateNotes: updateNotes.mutate,
    getApplicationStatus,
  };
};
