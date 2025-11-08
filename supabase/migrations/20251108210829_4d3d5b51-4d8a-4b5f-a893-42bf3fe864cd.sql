-- Add detailed information fields to credit_cards table for "Nerd Out" feature
-- These fields will store comprehensive card details for power users

ALTER TABLE credit_cards 
ADD COLUMN IF NOT EXISTS detailed_reward_breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS reward_caps_details TEXT,
ADD COLUMN IF NOT EXISTS detailed_benefits JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS earning_examples JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS fine_print TEXT,
ADD COLUMN IF NOT EXISTS insider_tips TEXT,
ADD COLUMN IF NOT EXISTS best_use_cases TEXT,
ADD COLUMN IF NOT EXISTS hidden_fees TEXT,
ADD COLUMN IF NOT EXISTS comparison_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN credit_cards.detailed_reward_breakdown IS 'JSON structure with base_rate, accelerated_categories, and milestone_bonuses';
COMMENT ON COLUMN credit_cards.reward_caps_details IS 'Plain text explanation of caps and limits';
COMMENT ON COLUMN credit_cards.detailed_benefits IS 'JSON with lounge_access details, insurance_coverage, etc.';
COMMENT ON COLUMN credit_cards.earning_examples IS 'JSON with spending scenarios and calculations';
COMMENT ON COLUMN credit_cards.fine_print IS 'Key terms and conditions highlights';
COMMENT ON COLUMN credit_cards.insider_tips IS 'Tips for maximizing card value';
COMMENT ON COLUMN credit_cards.best_use_cases IS 'Optimal usage scenarios';
COMMENT ON COLUMN credit_cards.hidden_fees IS 'All fees beyond annual fee';
COMMENT ON COLUMN credit_cards.comparison_notes IS 'Notes for comparing with similar cards';