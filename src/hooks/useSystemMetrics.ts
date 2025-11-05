import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TableStats {
  tableName: string;
  totalRows: number;
  rows7d: number;
  rows30d: number;
  lastUpdated: string | null;
}

export const useTableStatistics = () => {
  return useQuery({
    queryKey: ["analytics", "table-stats"],
    queryFn: async () => {
      const tables = [
        "profiles",
        "credit_cards",
        "user_cards",
        "card_applications",
        "user_shortlist",
        "spending_analyses",
        "processed_transactions",
        "analysis_runs",
        "merchant_intelligence",
        "user_reminders",
        "fee_waiver_goals",
        "content_feed",
        "analytics_events",
      ];

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const stats = await Promise.all(
        tables.map(async (tableName) => {
          try {
            // Use type assertion for dynamic table queries
            const [total, recent7d, recent30d] = await Promise.all([
              supabase.from(tableName as any).select("*", { count: "exact", head: true }),
              supabase.from(tableName as any).select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
              supabase.from(tableName as any).select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
            ]);

            // Get last updated timestamp
            let lastUpdated: string | null = null;
            try {
              const result = await supabase
                .from(tableName as any)
                .select("created_at")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
              
              lastUpdated = (result.data as any)?.created_at || null;
            } catch {
              // Some tables might not have created_at column
              lastUpdated = null;
            }

            return {
              tableName,
              totalRows: total.count || 0,
              rows7d: recent7d.count || 0,
              rows30d: recent30d.count || 0,
              lastUpdated,
            } as TableStats;
          } catch (error) {
            console.error(`Error fetching stats for ${tableName}:`, error);
            return {
              tableName,
              totalRows: 0,
              rows7d: 0,
              rows30d: 0,
              lastUpdated: null,
            } as TableStats;
          }
        })
      );

      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for system stats
  });
};

export const useAnalysisActivity = () => {
  return useQuery({
    queryKey: ["analytics", "analysis-activity"],
    queryFn: async () => {
      const { data: analyses, error } = await supabase
        .from("spending_analyses")
        .select("created_at, extraction_method")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const activityMap = new Map<string, { total: number; ai: number; manual: number }>();
      analyses.forEach(analysis => {
        const date = new Date(analysis.created_at).toISOString().split('T')[0];
        const current = activityMap.get(date) || { total: 0, ai: 0, manual: 0 };
        current.total++;
        if (analysis.extraction_method === 'ai_powered') {
          current.ai++;
        } else {
          current.manual++;
        }
        activityMap.set(date, current);
      });

      return Array.from(activityMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useSpendingCategories = () => {
  return useQuery({
    queryKey: ["analytics", "spending-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processed_transactions")
        .select("category, amount_minor");

      if (error) throw error;

      const categoryMap = new Map<string, number>();
      data.forEach(transaction => {
        const current = categoryMap.get(transaction.category) || 0;
        categoryMap.set(transaction.category, current + transaction.amount_minor);
      });

      return Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value: value / 100 })) // Convert minor to major
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 categories
    },
    staleTime: 2 * 60 * 1000,
  });
};
