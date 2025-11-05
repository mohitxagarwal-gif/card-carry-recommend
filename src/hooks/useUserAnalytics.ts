import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserDemographics = () => {
  return useQuery({
    queryKey: ["analytics", "demographics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("age_range, income_band_inr, city, marketing_consent");

      if (error) throw error;

      // Age distribution
      const ageDistribution = data.reduce((acc, profile) => {
        if (profile.age_range) {
          acc[profile.age_range] = (acc[profile.age_range] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Income distribution
      const incomeDistribution = data.reduce((acc, profile) => {
        if (profile.income_band_inr) {
          acc[profile.income_band_inr] = (acc[profile.income_band_inr] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // City distribution
      const cityDistribution = data.reduce((acc, profile) => {
        if (profile.city) {
          acc[profile.city] = (acc[profile.city] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Marketing consent
      const marketingConsent = data.filter(p => p.marketing_consent).length;

      return {
        ageDistribution: Object.entries(ageDistribution).map(([name, value]) => ({ name, value })),
        incomeDistribution: Object.entries(incomeDistribution).map(([name, value]) => ({ name, value })),
        cityDistribution: Object.entries(cityDistribution).map(([name, value]) => ({ name, value })),
        marketingConsentRate: data.length > 0 ? (marketingConsent / data.length) * 100 : 0,
        totalUsers: data.length,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useUserActivity = () => {
  return useQuery({
    queryKey: ["analytics", "user-activity"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, created_at, onboarding_completed")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const userActivities = await Promise.all(
        profiles.map(async (profile) => {
          const [analyses, applications, shortlist] = await Promise.all([
            supabase.from("spending_analyses").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
            supabase.from("card_applications").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
            supabase.from("user_shortlist").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
          ]);

          // Mask email
          const maskedEmail = profile.email.substring(0, 3) + "***" + profile.email.substring(profile.email.indexOf("@"));

          return {
            id: profile.id,
            email: maskedEmail,
            joinDate: profile.created_at,
            onboardingCompleted: profile.onboarding_completed,
            analysesCount: analyses.count || 0,
            applicationsCount: applications.count || 0,
            shortlistedCount: shortlist.count || 0,
          };
        })
      );

      return userActivities;
    },
    staleTime: 2 * 60 * 1000,
  });
};
