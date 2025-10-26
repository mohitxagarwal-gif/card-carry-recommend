import { supabase } from "@/integrations/supabase/client";

export const exportUserData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch all user data
  const [
    { data: profile },
    { data: snapshots },
    { data: shortlist },
    { data: applications },
    { data: userCards },
    { data: goals },
    { data: reminders },
    { data: preferences },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("recommendation_snapshots").select("*").order("created_at", { ascending: false }),
    supabase.from("user_shortlist").select("*").order("added_at", { ascending: false }),
    supabase.from("card_applications").select("*").order("created_at", { ascending: false }),
    supabase.from("user_cards").select("*").order("created_at", { ascending: false }),
    supabase.from("fee_waiver_goals").select("*").order("created_at", { ascending: false }),
    supabase.from("user_reminders").select("*").order("reminder_date", { ascending: true }),
    supabase.from("user_preferences").select("*").single(),
  ]);

  const exportData = {
    export_date: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    recommendations: snapshots || [],
    shortlist: shortlist || [],
    applications: applications || [],
    my_cards: userCards || [],
    goals: goals || [],
    reminders: reminders || [],
    preferences,
  };

  // Create JSON blob and download
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `card-carry-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
