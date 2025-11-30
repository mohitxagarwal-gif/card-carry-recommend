-- Add new preference fields to user_features table
ALTER TABLE public.user_features
ADD COLUMN IF NOT EXISTS travel_numeric double precision DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS lounge_numeric double precision DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS reward_preference text;

-- Add comment to describe the fields
COMMENT ON COLUMN public.user_features.travel_numeric IS 'Travel frequency score 0-10, derived from travel_frequency preference';
COMMENT ON COLUMN public.user_features.lounge_numeric IS 'Lounge importance score 0-10, derived from lounge_importance preference';
COMMENT ON COLUMN public.user_features.reward_preference IS 'User reward preference: cashback, points, or both';