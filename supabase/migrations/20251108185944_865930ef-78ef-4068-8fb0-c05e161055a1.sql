-- Phase 0: Database Schema Completion & Extensions (Fixed)

-- Extend profiles table with new columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS employment_type text CHECK (employment_type IN ('salaried','self_employed','student','other')),
  ADD COLUMN IF NOT EXISTS pay_in_full_habit text CHECK (pay_in_full_habit IN ('always','mostly','sometimes','rarely'));

-- Extend user_preferences table with new columns
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS fee_tolerance_band text CHECK (fee_tolerance_band IN ('zero','<=1k','<=5k','any_2x_roi')),
  ADD COLUMN IF NOT EXISTS excluded_issuers text[],
  ADD COLUMN IF NOT EXISTS reward_preference text CHECK (reward_preference IN ('cashback','points','either')),
  ADD COLUMN IF NOT EXISTS lounge_need text CHECK (lounge_need IN ('none','nice','must')),
  ADD COLUMN IF NOT EXISTS home_airports text[],
  ADD COLUMN IF NOT EXISTS domestic_trips_per_year int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS international_trips_per_year int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forex_spend_band text;

-- Extend user_owned_cards table
ALTER TABLE user_owned_cards
  ADD COLUMN IF NOT EXISTS opened_year int,
  ADD COLUMN IF NOT EXISTS credit_limit_est int,
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Extend user_features table with additional columns
ALTER TABLE user_features
  ADD COLUMN IF NOT EXISTS spend_split_json jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cabs_fuel_share float DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pif_score float DEFAULT 0.5 CHECK (pif_score BETWEEN 0 AND 1),
  ADD COLUMN IF NOT EXISTS fee_tolerance_numeric int DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS acceptance_risk_amex float DEFAULT 0.3 CHECK (acceptance_risk_amex BETWEEN 0 AND 1),
  ADD COLUMN IF NOT EXISTS data_source text CHECK (data_source IN ('self_report','statements','hybrid')) DEFAULT 'self_report',
  ADD COLUMN IF NOT EXISTS months_coverage int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_statement_date date;

-- Extend credit_cards table with eligibility fields
ALTER TABLE credit_cards
  ADD COLUMN IF NOT EXISTS min_income_band text,
  ADD COLUMN IF NOT EXISTS min_age int DEFAULT 21,
  ADD COLUMN IF NOT EXISTS max_age int,
  ADD COLUMN IF NOT EXISTS geo_availability jsonb DEFAULT '{"all": true}',
  ADD COLUMN IF NOT EXISTS employment_requirements text[],
  ADD COLUMN IF NOT EXISTS last_verified timestamptz;

-- Extend card_benefits table with additional fields
ALTER TABLE card_benefits
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS earn_rate_unit text DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS monthly_cap_inr int,
  ADD COLUMN IF NOT EXISTS annual_cap_inr int,
  ADD COLUMN IF NOT EXISTS min_transaction_inr int,
  ADD COLUMN IF NOT EXISTS valid_merchants text[],
  ADD COLUMN IF NOT EXISTS excluded_merchants text[],
  ADD COLUMN IF NOT EXISTS valid_days text[],
  ADD COLUMN IF NOT EXISTS valid_from date,
  ADD COLUMN IF NOT EXISTS valid_until date,
  ADD COLUMN IF NOT EXISTS terms_url text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_features_confidence ON user_features(feature_confidence);
CREATE INDEX IF NOT EXISTS idx_card_benefits_card_category ON card_benefits(card_id, category);
CREATE INDEX IF NOT EXISTS idx_brand_affinities_user ON brand_affinities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_owned_cards_user ON user_owned_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_owned_cards_active ON user_owned_cards(user_id, is_active);

-- Create helper functions for eligibility checking
CREATE OR REPLACE FUNCTION income_band_score(band text) RETURNS int
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN CASE band
    WHEN '0-25000' THEN 1
    WHEN '25000-50000' THEN 2
    WHEN '50000-100000' THEN 3
    WHEN '100000-200000' THEN 4
    WHEN '200000+' THEN 5
    ELSE 0
  END;
END;
$$;

CREATE OR REPLACE FUNCTION age_range_midpoint(range text) RETURNS int
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN CASE range
    WHEN '18-25' THEN 21
    WHEN '26-35' THEN 30
    WHEN '36-45' THEN 40
    WHEN '46-60' THEN 53
    WHEN '60+' THEN 65
    ELSE 30
  END;
END;
$$;