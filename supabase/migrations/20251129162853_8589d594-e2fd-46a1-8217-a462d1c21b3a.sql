-- Remove unused affiliate-related columns from credit_cards table
ALTER TABLE credit_cards 
DROP COLUMN IF EXISTS affiliate_partner,
DROP COLUMN IF EXISTS affiliate_commission_rate;

-- Add comment explaining why affiliate_clicks table is retained
COMMENT ON TABLE affiliate_clicks IS 'Deprecated: Previously used for affiliate tracking. Table retained for historical data but no longer actively used. All links now go directly to banks without commission tracking.';