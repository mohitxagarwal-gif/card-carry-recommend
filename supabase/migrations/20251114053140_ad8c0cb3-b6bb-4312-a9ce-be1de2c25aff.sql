-- Add missing performance indexes for admin timeline and recommendation queries

-- Index for admin timeline filtered queries (user_id + event_category + created_at)
CREATE INDEX IF NOT EXISTS idx_audit_log_user_category_time
  ON public.audit_log(user_id, event_category, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Index for recommendation_cards efficient lookups by user and snapshot
CREATE INDEX IF NOT EXISTS idx_recommendation_cards_user_snapshot
  ON public.recommendation_cards(user_id, snapshot_id);

-- Index for analytics_events category filtering
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type
  ON public.analytics_events(user_id, event_type, created_at DESC)
  WHERE user_id IS NOT NULL;
