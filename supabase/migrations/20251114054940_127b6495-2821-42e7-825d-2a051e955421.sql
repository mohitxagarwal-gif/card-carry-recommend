-- Fix security definer view by dropping and recreating without that option
DROP VIEW IF EXISTS public.schema_version;

CREATE OR REPLACE VIEW public.schema_version AS
SELECT 
  'v1.0.0'::text as version,
  now() as updated_at;

-- Enable RLS on the view (views inherit from underlying tables but this makes it explicit)
ALTER VIEW public.schema_version SET (security_invoker = true);