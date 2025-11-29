import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeriveRequest {
  userId: string;
  spendData?: {
    monthlySpend: number;
    spendSplit: Record<string, number>;
  };
  analysisId?: string;
  options?: {
    data_source?: 'statements' | 'self_report' | 'goal_based';
    pif_score?: number;
    fee_tolerance_numeric?: number;
    acceptance_risk_amex?: number;
    custom_weights?: Record<string, number>;
  };
}

export const useDeriveFeatures = () => {
  return useMutation({
    mutationFn: async (request: DeriveRequest) => {
      const { data, error } = await supabase.functions.invoke('derive-user-features', {
        body: request,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('[useDeriveFeatures] Features derived:', data);
    },
    onError: (error: any) => {
      console.error('[useDeriveFeatures] Error:', error);
      toast.error('Failed to calculate user features');
    },
  });
};
