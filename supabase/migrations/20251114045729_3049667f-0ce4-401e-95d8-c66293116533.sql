-- Fix security warnings: Set search_path for backfill functions

-- Fix backfill_analysis_transactions function
CREATE OR REPLACE FUNCTION public.backfill_analysis_transactions()
RETURNS TABLE (
  analysis_id UUID,
  transactions_migrated INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        RAISE NOTICE 'Error inserting transaction for analysis %: %', analysis_record.id, SQLERRM;
      END;
    END LOOP;
    
    analysis_id := analysis_record.id;
    transactions_migrated := inserted_count;
    status := 'completed';
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Fix backfill_recommendation_cards function
CREATE OR REPLACE FUNCTION public.backfill_recommendation_cards()
RETURNS TABLE (
  snapshot_id UUID,
  cards_migrated INTEGER,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  snapshot_record RECORD;
  card_record RECORD;
  cards_array JSONB;
  inserted_count INTEGER;
  card_rank INTEGER;
BEGIN
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
    
    IF jsonb_typeof(cards_array) != 'array' OR jsonb_array_length(cards_array) = 0 THEN
      CONTINUE;
    END IF;
    
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
        RAISE NOTICE 'Error inserting card for snapshot %: %', snapshot_record.id, SQLERRM;
      END;
    END LOOP;
    
    snapshot_id := snapshot_record.id;
    cards_migrated := inserted_count;
    status := 'completed';
    RETURN NEXT;
  END LOOP;
END;
$$;