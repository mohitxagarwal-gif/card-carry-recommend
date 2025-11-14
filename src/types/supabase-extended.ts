// Extended Supabase types for tables not yet in auto-generated types.ts
// TODO: Remove this file once src/integrations/supabase/types.ts regenerates

import { Database } from "@/integrations/supabase/types";

export type AuditLogRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  actor: string;
  event_type: string;
  event_category: string | null;
  severity: string | null;
  metadata: Record<string, any> | null;
  request_id: string | null;
};

export type AuditLogInsert = Omit<AuditLogRow, 'id' | 'created_at'>;

export type AnalysisTransactionRow = {
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
  deduplication_group_id: string | null;
  source_statement_path: string | null;
  created_at: string;
  updated_at: string;
};

export type RecommendationCardRow = {
  id: string;
  user_id: string;
  snapshot_id: string;
  card_id: string;
  rank: number;
  match_score: number;
  estimated_annual_value_inr: number | null;
  confidence: string | null;
  reasoning: string | null;
  benefits_matched: Record<string, any> | null;
  top_categories: any[] | null;
  warnings: any[] | null;
  eligibility_notes: string | null;
  created_at: string;
};

export type RecommendationCardInsert = Omit<RecommendationCardRow, 'id' | 'created_at'>;

export type DataRetentionConfigRow = {
  id: string;
  table_name: string;
  date_column: string;
  retention_days: number;
  enabled: boolean;
  last_cleanup_at: string | null;
  created_at: string;
  updated_at: string;
};

// Extended profiles type with consent fields
export type ExtendedProfileRow = Database['public']['Tables']['profiles']['Row'] & {
  data_processing_consent: boolean | null;
  data_processing_consent_at: string | null;
  terms_version: string | null;
  privacy_version: string | null;
};

export type ExtendedProfileUpdate = Database['public']['Tables']['profiles']['Update'] & {
  data_processing_consent?: boolean | null;
  data_processing_consent_at?: string | null;
  terms_version?: string | null;
  privacy_version?: string | null;
};
