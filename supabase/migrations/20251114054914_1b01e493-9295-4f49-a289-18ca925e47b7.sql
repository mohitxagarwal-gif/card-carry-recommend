-- Force Supabase types regeneration by creating a view
CREATE OR REPLACE VIEW public.schema_version AS
SELECT 
  'v1.0.0'::text as version,
  now() as updated_at;

-- Add comments to new tables to trigger introspection
COMMENT ON TABLE public.audit_log IS 'System audit log for tracking all security and data events';
COMMENT ON TABLE public.analysis_transactions IS 'Normalized transaction data extracted from spending analyses';
COMMENT ON TABLE public.recommendation_cards IS 'Individual card recommendations linked to snapshots';
COMMENT ON TABLE public.data_retention_config IS 'Configuration for automated data cleanup and retention policies';

-- Add comments to new consent columns
COMMENT ON COLUMN public.profiles.data_processing_consent IS 'User consent for data processing';
COMMENT ON COLUMN public.profiles.data_processing_consent_at IS 'Timestamp when consent was given';
COMMENT ON COLUMN public.profiles.terms_version IS 'Version of terms accepted';
COMMENT ON COLUMN public.profiles.privacy_version IS 'Version of privacy policy accepted';