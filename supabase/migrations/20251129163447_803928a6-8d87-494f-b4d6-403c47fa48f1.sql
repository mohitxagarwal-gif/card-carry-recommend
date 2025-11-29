-- Phase 1: Add new columns for multi-path onboarding

-- 1. Add snapshot_type to recommendation_snapshots
ALTER TABLE recommendation_snapshots 
ADD COLUMN IF NOT EXISTS snapshot_type TEXT DEFAULT 'statement_based';

-- Add check constraint for valid snapshot types
ALTER TABLE recommendation_snapshots
ADD CONSTRAINT valid_snapshot_type 
CHECK (snapshot_type IN ('statement_based', 'quick_spends', 'goal_based'));

-- 2. Add custom_weights to user_features
ALTER TABLE user_features
ADD COLUMN IF NOT EXISTS custom_weights JSONB DEFAULT '{}'::jsonb;

-- 3. Create index for efficient snapshot queries
CREATE INDEX IF NOT EXISTS idx_recommendation_snapshots_user_created 
ON recommendation_snapshots (user_id, created_at DESC);

-- 4. Backfill existing snapshots as 'statement_based'
UPDATE recommendation_snapshots 
SET snapshot_type = 'statement_based'
WHERE snapshot_type IS NULL;

COMMENT ON COLUMN recommendation_snapshots.snapshot_type IS 'Source of recommendations: statement_based (PDF upload), quick_spends (manual entry), or goal_based (preset goals)';
COMMENT ON COLUMN user_features.custom_weights IS 'Optional custom scoring weights for goal-based recommendations: {"travelFit": 0.4, "rewardRelevance": 0.3, ...}';