-- Phase 2: Create analysis_runs table for snapshot architecture
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL,
  transaction_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own analysis runs"
  ON public.analysis_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis runs"
  ON public.analysis_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis runs"
  ON public.analysis_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Add analysis_run_id to spending_analyses
ALTER TABLE public.spending_analyses 
ADD COLUMN IF NOT EXISTS analysis_run_id UUID REFERENCES public.analysis_runs(id) ON DELETE SET NULL;

-- Phase 5: Create processed_transactions table for deduplication
CREATE TABLE IF NOT EXISTS public.processed_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  posted_date DATE NOT NULL,
  amount_minor INTEGER NOT NULL,
  normalized_merchant TEXT NOT NULL,
  category TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, transaction_id)
);

-- Enable RLS
ALTER TABLE public.processed_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own processed transactions"
  ON public.processed_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processed transactions"
  ON public.processed_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processed transactions"
  ON public.processed_transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_transactions_hash 
  ON public.processed_transactions(user_id, transaction_hash);

CREATE INDEX IF NOT EXISTS idx_processed_transactions_id 
  ON public.processed_transactions(user_id, transaction_id);

-- Update trigger for analysis_runs
CREATE TRIGGER update_analysis_runs_updated_at
  BEFORE UPDATE ON public.analysis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();