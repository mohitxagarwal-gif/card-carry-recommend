import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisTransaction {
  id: string;
  user_id: string;
  analysis_id: string;
  transaction_id: string;
  transaction_hash: string;
  posted_date: string;
  amount_minor: number;
  merchant_raw: string;
  merchant_normalized: string;
  merchant_canonical: string | null;
  category: string;
  subcategory: string | null;
  categorization_confidence: number | null;
  source_statement_path: string | null;
  deduplication_group_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch normalized transactions for a specific analysis
 * This replaces parsing transactions from analysis_data JSONB
 */
export const useAnalysisTransactions = (analysisId: string | null) => {
  return useQuery({
    queryKey: ["analysis-transactions", analysisId],
    queryFn: async () => {
      if (!analysisId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("analysis_transactions")
        .select("*")
        .eq("analysis_id", analysisId)
        .order("posted_date", { ascending: false });

      if (error) throw error;
      return (data || []) as AnalysisTransaction[];
    },
    enabled: !!analysisId,
  });
};

/**
 * Hook to fetch all transactions for current user
 * Useful for dashboards and aggregate views
 */
export const useUserTransactions = (options?: {
  limit?: number;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) => {
  return useQuery({
    queryKey: ["user-transactions", options],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("analysis_transactions")
        .select("*")
        .eq("user_id", user.id);

      if (options?.category) {
        query = query.eq("category", options.category);
      }

      if (options?.dateFrom) {
        query = query.gte("posted_date", options.dateFrom.toISOString().split('T')[0]);
      }

      if (options?.dateTo) {
        query = query.lte("posted_date", options.dateTo.toISOString().split('T')[0]);
      }

      query = query.order("posted_date", { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AnalysisTransaction[];
    },
  });
};

/**
 * Hook to get transaction statistics
 */
export const useTransactionStats = (analysisId: string | null) => {
  return useQuery({
    queryKey: ["transaction-stats", analysisId],
    queryFn: async () => {
      if (!analysisId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: transactions, error } = await supabase
        .from("analysis_transactions")
        .select("amount_minor, category, posted_date")
        .eq("analysis_id", analysisId);

      if (error) throw error;

      if (!transactions || transactions.length === 0) return null;

      const totalSpent = transactions.reduce((sum, t) => sum + t.amount_minor, 0);
      
      const categoryTotals: Record<string, number> = {};
      transactions.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount_minor;
      });

      const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      const dates = transactions.map(t => new Date(t.posted_date));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

      return {
        totalTransactions: transactions.length,
        totalSpent,
        avgTransactionAmount: totalSpent / transactions.length,
        topCategories: sortedCategories,
        dateRange: {
          start: minDate,
          end: maxDate,
        },
      };
    },
    enabled: !!analysisId,
  });
};
