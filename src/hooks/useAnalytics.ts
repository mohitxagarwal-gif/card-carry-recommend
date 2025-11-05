import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface OverviewMetrics {
  totalUsers: number;
  completedOnboarding: number;
  newUsers7d: number;
  newUsers30d: number;
  onboardingRate: number;
  totalApplications: number;
  applicationsByStatus: { status: string; count: number }[];
  totalAnalyses: number;
  analyses7d: number;
  activeCards: number;
  totalShortlisted: number;
}

export const useOverviewMetrics = (dateRange?: DateRange) => {
  return useQuery({
    queryKey: ["analytics", "overview", dateRange],
    queryFn: async () => {
      const [usersResult, applicationsResult, analysesResult, cardsResult, shortlistResult] = await Promise.all([
        supabase.from("profiles").select("id, created_at, onboarding_completed"),
        supabase.from("card_applications").select("id, status, created_at"),
        supabase.from("spending_analyses").select("id, created_at"),
        supabase.from("credit_cards").select("id").eq("is_active", true),
        supabase.from("user_shortlist").select("id"),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (applicationsResult.error) throw applicationsResult.error;
      if (analysesResult.error) throw analysesResult.error;
      if (cardsResult.error) throw cardsResult.error;
      if (shortlistResult.error) throw shortlistResult.error;

      const users = usersResult.data || [];
      const applications = applicationsResult.data || [];
      const analyses = analysesResult.data || [];

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newUsers7d = users.filter(u => new Date(u.created_at) > sevenDaysAgo).length;
      const newUsers30d = users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;
      const completedOnboarding = users.filter(u => u.onboarding_completed).length;

      const analyses7d = analyses.filter(a => new Date(a.created_at) > sevenDaysAgo).length;

      const applicationsByStatus = applications.reduce((acc, app) => {
        const existing = acc.find(a => a.status === app.status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status: app.status, count: 1 });
        }
        return acc;
      }, [] as { status: string; count: number }[]);

      return {
        totalUsers: users.length,
        completedOnboarding,
        newUsers7d,
        newUsers30d,
        onboardingRate: users.length > 0 ? (completedOnboarding / users.length) * 100 : 0,
        totalApplications: applications.length,
        applicationsByStatus,
        totalAnalyses: analyses.length,
        analyses7d,
        activeCards: cardsResult.data?.length || 0,
        totalShortlisted: shortlistResult.data?.length || 0,
      } as OverviewMetrics;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserGrowth = (days = 90) => {
  return useQuery({
    queryKey: ["analytics", "user-growth", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const growthMap = new Map<string, number>();
      data.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
      });

      return Array.from(growthMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useApplicationFunnel = () => {
  return useQuery({
    queryKey: ["analytics", "application-funnel"],
    queryFn: async () => {
      const [users, onboarded, analyses, shortlisted, applications] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_completed", true),
        supabase.from("spending_analyses").select("user_id").then(res => 
          res.data ? new Set(res.data.map(a => a.user_id)).size : 0
        ),
        supabase.from("user_shortlist").select("user_id").then(res =>
          res.data ? new Set(res.data.map(s => s.user_id)).size : 0
        ),
        supabase.from("card_applications").select("user_id").then(res =>
          res.data ? new Set(res.data.map(a => a.user_id)).size : 0
        ),
      ]);

      return [
        { stage: "Registered", count: users.count || 0 },
        { stage: "Onboarded", count: onboarded.count || 0 },
        { stage: "Analyzed", count: analyses },
        { stage: "Shortlisted", count: shortlisted },
        { stage: "Applied", count: applications },
      ];
    },
    staleTime: 2 * 60 * 1000,
  });
};
