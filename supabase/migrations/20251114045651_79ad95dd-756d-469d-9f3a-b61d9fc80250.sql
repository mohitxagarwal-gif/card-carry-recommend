-- Phase 1B: Create normalized analysis_transactions and recommendation_cards tables

-- ============================================================================
-- 1. Create analysis_transactions table
-- ============================================================================
-- This normalizes spending_analyses.analysis_data JSONB to enable efficient querying
-- of individual transactions without parsing large JSONB blobs

CREATE TABLE IF NOT EXISTS public.analysis_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.spending_analyses(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_id TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  posted_date DATE NOT NULL,
  amount_minor INTEGER NOT NULL,
  
  -- Merchant information
  merchant_raw TEXT NOT NULL,
  merchant_normalized TEXT NOT NULL,
  merchant_canonical TEXT,
  
  -- Categorization
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Metadata for debugging and quality
  categorization_confidence NUMERIC(3,2),
  source_statement_path TEXT,
  deduplication_group_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(transaction_hash, analysis_id)
);

-- Indexes for analysis_transactions
CREATE INDEX idx_analysis_transactions_user_id ON public.analysis_transactions(user_id, created_at DESC);
CREATE INDEX idx_analysis_transactions_analysis_id ON public.analysis_transactions(analysis_id);
CREATE INDEX idx_analysis_transactions_posted_date ON public.analysis_transactions(user_id, posted_date DESC);
CREATE INDEX idx_analysis_transactions_category ON public.analysis_transactions(user_id, category);
CREATE INDEX idx_analysis_transactions_merchant ON public.analysis_transactions(user_id, merchant_normalized);
CREATE INDEX idx_analysis_transactions_amount ON public.analysis_transactions(user_id, amount_minor DESC);

-- RLS for analysis_transactions
ALTER TABLE public.analysis_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis transactions"
  ON public.analysis_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis transactions"
  ON public.analysis_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis transactions"
  ON public.analysis_transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis transactions"
  ON public.analysis_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analysis transactions"
  ON public.analysis_transactions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_analysis_transactions_updated_at
  BEFORE UPDATE ON public.analysis_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. Create recommendation_cards table
-- ============================================================================
-- This normalizes recommendation_snapshots.recommended_cards JSONB to enable
-- efficient querying of individual card recommendations

CREATE TABLE IF NOT EXISTS public.recommendation_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES public.recommendation_snapshots(id) ON DELETE CASCADE,
  
  -- Card identification
  card_id TEXT NOT NULL,
  
  -- Recommendation metrics
  rank INTEGER NOT NULL,
  match_score NUMERIC(5,2) NOT NULL,
  estimated_annual_value_inr INTEGER,
  confidence TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  
  -- Reasoning and benefits
  reasoning TEXT,
  benefits_matched JSONB DEFAULT '{}'::jsonb,
  top_categories JSONB DEFAULT '[]'::jsonb,
  
  -- Warnings and caveats
  warnings JSONB DEFAULT '[]'::jsonb,
  eligibility_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(snapshot_id, card_id)
);

-- Indexes for recommendation_cards
CREATE INDEX idx_recommendation_cards_user_id ON public.recommendation_cards(user_id, created_at DESC);
CREATE INDEX idx_recommendation_cards_snapshot_id ON public.recommendation_cards(snapshot_id, rank);
CREATE INDEX idx_recommendation_cards_card_id ON public.recommendation_cards(card_id);
CREATE INDEX idx_recommendation_cards_match_score ON public.recommendation_cards(user_id, match_score DESC);
CREATE INDEX idx_recommendation_cards_user_card ON public.recommendation_cards(user_id, card_id);

-- RLS for recommendation_cards
ALTER TABLE public.recommendation_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendation cards"
  ON public.recommendation_cards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation cards"
  ON public.recommendation_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendation cards"
  ON public.recommendation_cards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recommendation cards"
  ON public.recommendation_cards
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all recommendation cards"
  ON public.recommendation_cards
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 3. Backfill function for analysis_transactions
-- ============================================================================
-- Function to migrate data from spending_analyses.analysis_data JSONB to analysis_transactions

CREATE OR REPLACE FUNCTION public.backfill_analysis_transactions()
RETURNS TABLE (
  analysis_id UUID,
  transactions_migrated INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analysis_record RECORD;
  transaction_record RECORD;
  transactions_array JSONB;
  inserted_count INTEGER;
BEGIN
  -- Iterate through all spending_analyses that have transactions in analysis_data
  FOR analysis_record IN 
    SELECT 
      id,
      user_id,
      analysis_data
    FROM public.spending_analyses
    WHERE analysis_data ? 'transactions'
  LOOP
    inserted_count := 0;
    transactions_array := analysis_record.analysis_data->'transactions';
    
    -- Skip if transactions is not an array or is empty
    IF jsonb_typeof(transactions_array) != 'array' OR jsonb_array_length(transactions_array) = 0 THEN
      CONTINUE;
    END IF;
    
    -- Insert each transaction
    FOR transaction_record IN 
      SELECT * FROM jsonb_array_elements(transactions_array)
    LOOP
      BEGIN
        INSERT INTO public.analysis_transactions (
          user_id,
          analysis_id,
          transaction_id,
          transaction_hash,
          posted_date,
          amount_minor,
          merchant_raw,
          merchant_normalized,
          merchant_canonical,
          category,
          subcategory,
          categorization_confidence
        )
        VALUES (
          analysis_record.user_id,
          analysis_record.id,
          COALESCE(transaction_record.value->>'transaction_id', transaction_record.value->>'id', gen_random_uuid()::text),
          COALESCE(transaction_record.value->>'transaction_hash', md5(transaction_record.value::text)),
          (transaction_record.value->>'posted_date')::date,
          (transaction_record.value->>'amount_minor')::integer,
          transaction_record.value->>'merchant_raw',
          transaction_record.value->>'merchant_normalized',
          transaction_record.value->>'merchant_canonical',
          transaction_record.value->>'category',
          transaction_record.value->>'subcategory',
          (transaction_record.value->>'categorization_confidence')::numeric
        )
        ON CONFLICT (transaction_hash, analysis_id) DO NOTHING;
        
        inserted_count := inserted_count + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue with next transaction
        RAISE NOTICE 'Error inserting transaction for analysis %: %', analysis_record.id, SQLERRM;
      END;
    END LOOP;
    
    -- Return progress
    analysis_id := analysis_record.id;
    transactions_migrated := inserted_count;
    status := 'completed';
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ============================================================================
-- 4. Backfill function for recommendation_cards
-- ============================================================================
-- Function to migrate data from recommendation_snapshots.recommended_cards JSONB

CREATE OR REPLACE FUNCTION public.backfill_recommendation_cards()
RETURNS TABLE (
  snapshot_id UUID,
  cards_migrated INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  snapshot_record RECORD;
  card_record RECORD;
  cards_array JSONB;
  inserted_count INTEGER;
  card_rank INTEGER;
BEGIN
  -- Iterate through all recommendation_snapshots
  FOR snapshot_record IN 
    SELECT 
      id,
      user_id,
      recommended_cards
    FROM public.recommendation_snapshots
    WHERE recommended_cards IS NOT NULL
  LOOP
    inserted_count := 0;
    card_rank := 1;
    cards_array := snapshot_record.recommended_cards;
    
    -- Skip if recommended_cards is not an array or is empty
    IF jsonb_typeof(cards_array) != 'array' OR jsonb_array_length(cards_array) = 0 THEN
      CONTINUE;
    END IF;
    
    -- Insert each card recommendation
    FOR card_record IN 
      SELECT * FROM jsonb_array_elements(cards_array)
    LOOP
      BEGIN
        INSERT INTO public.recommendation_cards (
          user_id,
          snapshot_id,
          card_id,
          rank,
          match_score,
          estimated_annual_value_inr,
          confidence,
          reasoning,
          benefits_matched,
          top_categories,
          warnings,
          eligibility_notes
        )
        VALUES (
          snapshot_record.user_id,
          snapshot_record.id,
          card_record.value->>'card_id',
          card_rank,
          COALESCE((card_record.value->>'match_score')::numeric, (card_record.value->>'score')::numeric, 0),
          (card_record.value->>'estimated_annual_value')::integer,
          COALESCE(card_record.value->>'confidence', 'medium'),
          card_record.value->>'reasoning',
          COALESCE(card_record.value->'benefits_matched', '{}'::jsonb),
          COALESCE(card_record.value->'top_categories', '[]'::jsonb),
          COALESCE(card_record.value->'warnings', '[]'::jsonb),
          card_record.value->>'eligibility_notes'
        )
        ON CONFLICT (snapshot_id, card_id) DO NOTHING;
        
        inserted_count := inserted_count + 1;
        card_rank := card_rank + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue with next card
        RAISE NOTICE 'Error inserting card for snapshot %: %', snapshot_record.id, SQLERRM;
      END;
    END LOOP;
    
    -- Return progress
    snapshot_id := snapshot_record.id;
    cards_migrated := inserted_count;
    status := 'completed';
    RETURN NEXT;
  END LOOP;
END;
$$;