-- Fix user_features data_source constraint to include 'goal_based'
ALTER TABLE user_features DROP CONSTRAINT IF EXISTS user_features_data_source_check;

ALTER TABLE user_features 
ADD CONSTRAINT user_features_data_source_check 
CHECK (data_source = ANY (ARRAY['self_report'::text, 'statements'::text, 'hybrid'::text, 'goal_based'::text]));