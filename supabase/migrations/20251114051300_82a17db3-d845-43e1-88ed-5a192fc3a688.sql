-- Phase 1C: Merge user_cards and user_owned_cards tables

-- Step 1: Add missing columns from user_owned_cards to user_cards
ALTER TABLE public.user_cards
  ADD COLUMN IF NOT EXISTS issuer TEXT,
  ADD COLUMN IF NOT EXISTS network TEXT,
  ADD COLUMN IF NOT EXISTS product TEXT,
  ADD COLUMN IF NOT EXISTS opened_year INTEGER,
  ADD COLUMN IF NOT EXISTS credit_limit_estimate INTEGER,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Step 2: Create migration function to backfill data
CREATE OR REPLACE FUNCTION migrate_user_owned_cards_to_user_cards()
RETURNS TABLE(migrated_count INTEGER, skipped_count INTEGER, status TEXT) AS $$
DECLARE
  migrated INTEGER := 0;
  skipped INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN SELECT * FROM public.user_owned_cards WHERE is_active = true
  LOOP
    -- Check if card already exists in user_cards
    IF EXISTS (
      SELECT 1 FROM public.user_cards 
      WHERE user_id = rec.user_id AND card_id = rec.card_id
    ) THEN
      skipped := skipped + 1;
      CONTINUE;
    END IF;
    
    -- Insert into user_cards
    INSERT INTO public.user_cards (
      user_id, card_id, issuer, network, product,
      opened_year, opened_month, renewal_month,
      credit_limit_estimate, is_primary, is_active,
      created_at, updated_at
    ) VALUES (
      rec.user_id,
      rec.card_id,
      rec.issuer,
      rec.network,
      rec.product,
      rec.opened_year,
      -- Convert integer month to YYYY-MM format if we have year + month
      CASE 
        WHEN rec.opened_year IS NOT NULL AND rec.opened_month IS NOT NULL 
        THEN rec.opened_year::TEXT || '-' || LPAD(rec.opened_month::TEXT, 2, '0')
        ELSE NULL 
      END,
      -- Convert fee_renewal_month to YYYY-MM
      CASE 
        WHEN rec.fee_renewal_month IS NOT NULL 
        THEN COALESCE(rec.opened_year, EXTRACT(YEAR FROM CURRENT_DATE))::TEXT || '-' || LPAD(rec.fee_renewal_month::TEXT, 2, '0')
        ELSE NULL 
      END,
      COALESCE(rec.credit_limit_estimate, rec.credit_limit_est),
      rec.is_primary,
      rec.is_active,
      rec.created_at,
      rec.updated_at
    );
    
    migrated := migrated + 1;
  END LOOP;
  
  migrated_count := migrated;
  skipped_count := skipped;
  status := 'completed';
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 3: Deprecate user_owned_cards table
COMMENT ON TABLE public.user_owned_cards IS 
'DEPRECATED: This table has been merged into user_cards. Will be dropped after 2025-12-14. Do not use in new code.';