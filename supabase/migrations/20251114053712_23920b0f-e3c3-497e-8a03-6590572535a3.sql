-- Add index to force types regeneration
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup ON public.profiles(email);

-- Verify all required tables exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    RAISE EXCEPTION 'audit_log table missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analysis_transactions') THEN
    RAISE EXCEPTION 'analysis_transactions table missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recommendation_cards') THEN
    RAISE EXCEPTION 'recommendation_cards table missing';
  END IF;
END $$;