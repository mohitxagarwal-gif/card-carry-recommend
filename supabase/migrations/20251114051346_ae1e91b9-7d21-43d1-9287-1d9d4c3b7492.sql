-- Phase 3: Data Retention Policy

-- Create retention config table
CREATE TABLE IF NOT EXISTS public.data_retention_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  date_column TEXT NOT NULL DEFAULT 'created_at',
  enabled BOOLEAN DEFAULT true,
  last_cleanup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.data_retention_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage retention config
CREATE POLICY "Admins can manage retention config"
ON public.data_retention_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default retention policies
INSERT INTO public.data_retention_config (table_name, retention_days, date_column) VALUES
  ('spending_analyses', 547, 'created_at'), -- 18 months
  ('analysis_transactions', 547, 'created_at'),
  ('recommendation_snapshots', 547, 'created_at'),
  ('recommendation_cards', 547, 'created_at'),
  ('analytics_events', 730, 'created_at'), -- 24 months
  ('card_views', 730, 'viewed_at'),
  ('affiliate_clicks', 730, 'clicked_at'),
  ('audit_log', 730, 'created_at')
ON CONFLICT (table_name) DO NOTHING;

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(
  table_name TEXT,
  rows_deleted INTEGER,
  cleanup_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  config_rec RECORD;
  deleted_count INTEGER;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  FOR config_rec IN 
    SELECT * FROM public.data_retention_config 
    WHERE enabled = true
  LOOP
    cutoff_date := NOW() - (config_rec.retention_days || ' days')::INTERVAL;
    
    -- Dynamic SQL to delete old records
    EXECUTE format(
      'DELETE FROM public.%I WHERE %I < $1',
      config_rec.table_name,
      config_rec.date_column
    ) USING cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Update last cleanup timestamp
    UPDATE public.data_retention_config
    SET last_cleanup_at = NOW()
    WHERE id = config_rec.id;
    
    -- Log cleanup to audit_log
    INSERT INTO public.audit_log (
      user_id, actor, event_type, event_category, severity, metadata
    ) VALUES (
      NULL,
      'system',
      'DATA_RETENTION_CLEANUP',
      'system',
      'info',
      jsonb_build_object(
        'table', config_rec.table_name,
        'rows_deleted', deleted_count,
        'cutoff_date', cutoff_date
      )
    );
    
    table_name := config_rec.table_name;
    rows_deleted := deleted_count;
    cleanup_date := NOW();
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;