-- Force types regeneration by adding a harmless comment to trigger schema update
COMMENT ON TABLE public.audit_log IS 'System audit log for tracking all significant events';
COMMENT ON TABLE public.analysis_transactions IS 'Normalized transaction data from spending analyses';
COMMENT ON TABLE public.recommendation_cards IS 'Normalized recommendation cards from snapshots';
COMMENT ON TABLE public.data_retention_config IS 'Configuration for automated data retention policies';