import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";

interface UserReminder {
  id: string;
  user_id: string;
  card_id: string | null;
  reminder_type: string;
  title: string;
  description: string | null;
  reminder_date: string;
  dismissed: boolean | null;
  created_at: string;
}

export const useReminders = () => {
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["user-reminders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_reminders")
        .select("*")
        .eq("dismissed", false)
        .gte("reminder_date", new Date().toISOString().split('T')[0])
        .order("reminder_date", { ascending: true });

      if (error) throw error;
      return data as UserReminder[];
    },
  });

  const createReminder = useMutation({
    mutationFn: async (reminderData: {
      reminder_type: string;
      title: string;
      description?: string;
      reminder_date: string;
      card_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_reminders")
        .insert({ 
          user_id: user.id, 
          ...reminderData,
          dismissed: false
        });

      if (error) throw error;
      trackEvent("reminder_create", { type: reminderData.reminder_type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reminders"] });
      toast.success("Reminder created");
    },
    onError: () => {
      toast.error("Failed to create reminder");
    },
  });

  const dismissReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_reminders")
        .update({ dismissed: true })
        .eq("id", id);

      if (error) throw error;
      trackEvent("reminder_dismiss", { reminderId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reminders"] });
      toast.success("Reminder dismissed");
    },
    onError: () => {
      toast.error("Failed to dismiss reminder");
    },
  });

  const getUpcomingReminders = (limit: number = 5) => {
    return reminders.slice(0, limit);
  };

  const getRemindersByType = (type: string) => {
    return reminders.filter((reminder) => reminder.reminder_type === type);
  };

  const getUrgency = (reminderDate: string): 'high' | 'medium' | 'low' => {
    const today = new Date();
    const targetDate = new Date(reminderDate);
    const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 7) return 'high';
    if (daysUntil < 30) return 'medium';
    return 'low';
  };

  return {
    reminders,
    isLoading,
    createReminder: createReminder.mutate,
    dismissReminder: dismissReminder.mutate,
    getUpcomingReminders,
    getRemindersByType,
    getUrgency,
  };
};
