-- Phase 0: Extend existing tables and create new tables for enhanced recommendation engine

-- ============================================
-- 1. EXTEND profiles table
-- ============================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS employment_type text CHECK (employment_type IN ('salaried','self_employed','student','other')),
  ADD COLUMN IF NOT EXISTS pay_in_full_habit text CHECK (pay_in_full_habit IN ('always','mostly','sometimes'));

-- ============================================
-- 2. EXTEND user_preferences table
-- ============================================
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS fee_tolerance_band text CHECK (fee_tolerance_band IN ('zero','<=1k','<=5k','any_2x_roi')),
  ADD COLUMN IF NOT EXISTS excluded_issuers text[],
  ADD COLUMN IF NOT EXISTS reward_preference text CHECK (reward_preference IN ('cashback','points','either')),
  ADD COLUMN IF NOT EXISTS lounge_need text CHECK (lounge_need IN ('none','nice','must')),
  ADD COLUMN IF NOT EXISTS home_airports text[],
  ADD COLUMN IF NOT EXISTS domestic_trips_per_year integer,
  ADD COLUMN IF NOT EXISTS international_trips_per_year integer,
  ADD COLUMN IF NOT EXISTS forex_spend_band text;

-- ============================================
-- 3. EXTEND credit_cards table
-- ============================================
ALTER TABLE credit_cards
  ADD COLUMN IF NOT EXISTS min_income_band text,
  ADD COLUMN IF NOT EXISTS min_age integer,
  ADD COLUMN IF NOT EXISTS max_age integer,
  ADD COLUMN IF NOT EXISTS employment_requirements text[],
  ADD COLUMN IF NOT EXISTS lounge_policy jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS geo_availability jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_verified timestamptz;

-- ============================================
-- 4. CREATE user_owned_cards table
-- ============================================
CREATE TABLE IF NOT EXISTS user_owned_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  issuer text NOT NULL,
  product text NOT NULL,
  network text,
  opened_month integer,
  fee_renewal_month integer,
  credit_limit_estimate integer,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- Enable RLS
ALTER TABLE user_owned_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_owned_cards
CREATE POLICY "Users can view their own cards"
  ON user_owned_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON user_owned_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON user_owned_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON user_owned_cards FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. CREATE brand_affinities table
-- ============================================
CREATE TABLE IF NOT EXISTS brand_affinities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand text NOT NULL,
  category text,
  affinity_score float CHECK (affinity_score BETWEEN 0 AND 1),
  source text CHECK (source IN ('self_report','derived','both')) DEFAULT 'self_report',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, brand)
);

-- Enable RLS
ALTER TABLE brand_affinities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brand_affinities
CREATE POLICY "Users can view their own brand affinities"
  ON brand_affinities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand affinities"
  ON brand_affinities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand affinities"
  ON brand_affinities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand affinities"
  ON brand_affinities FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. CREATE user_features table (materialized)
-- ============================================
CREATE TABLE IF NOT EXISTS user_features (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Spending patterns
  spend_split_json jsonb DEFAULT '{}'::jsonb,
  monthly_spend_estimate integer,
  online_share float DEFAULT 0,
  dining_share float DEFAULT 0,
  groceries_share float DEFAULT 0,
  travel_share float DEFAULT 0,
  cabs_fuel_share float DEFAULT 0,
  bills_utilities_share float DEFAULT 0,
  entertainment_share float DEFAULT 0,
  rent_share float DEFAULT 0,
  forex_share float DEFAULT 0,
  upi_cc_share float DEFAULT 0,
  
  -- Behavioral signals
  pif_score float CHECK (pif_score BETWEEN 0 AND 1),
  fee_tolerance_numeric integer DEFAULT 0,
  acceptance_risk_amex float DEFAULT 0,
  
  -- Data quality
  months_coverage integer DEFAULT 0,
  transaction_count integer DEFAULT 0,
  last_statement_date date,
  feature_confidence float CHECK (feature_confidence BETWEEN 0 AND 1) DEFAULT 0.5,
  data_source text CHECK (data_source IN ('self_report','statements','hybrid')) DEFAULT 'self_report',
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_features
CREATE POLICY "Users can view their own features"
  ON user_features FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own features"
  ON user_features FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own features"
  ON user_features FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all features for analytics
CREATE POLICY "Admins can view all features"
  ON user_features FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 7. CREATE card_benefits table (core catalog)
-- ============================================
CREATE TABLE IF NOT EXISTS card_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id text NOT NULL,
  
  -- Benefit categorization
  category text NOT NULL,
  subcategory text,
  benefit_name text,
  
  -- Reward structure
  earn_type text CHECK (earn_type IN ('cashback','points','miles')) NOT NULL,
  earn_rate float NOT NULL,
  earn_rate_description text,
  
  -- Caps and limits
  monthly_cap_inr integer,
  annual_cap_inr integer,
  min_transaction_inr integer,
  
  -- Eligibility and exclusions
  valid_merchants text[],
  excluded_merchants text[],
  merchant_codes text[],
  valid_days text[],
  valid_hours_start time,
  valid_hours_end time,
  
  -- Date validity
  valid_from date,
  valid_until date,
  
  -- Partner info
  partner_brands text[],
  bonus_multiplier float,
  
  -- Documentation
  terms_url text,
  verification_notes text,
  last_verified timestamptz DEFAULT now(),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_benefits_card ON card_benefits(card_id);
CREATE INDEX IF NOT EXISTS idx_benefits_category ON card_benefits(category);
CREATE INDEX IF NOT EXISTS idx_benefits_valid_dates ON card_benefits(valid_from, valid_until);

-- Enable RLS
ALTER TABLE card_benefits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for card_benefits
CREATE POLICY "Anyone can view active benefits"
  ON card_benefits FOR SELECT
  USING (
    (valid_from IS NULL OR valid_from <= CURRENT_DATE) AND
    (valid_until IS NULL OR valid_until >= CURRENT_DATE)
  );

CREATE POLICY "Admins can manage benefits"
  ON card_benefits FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 8. CREATE triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_user_owned_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_owned_cards_timestamp
  BEFORE UPDATE ON user_owned_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_owned_cards_updated_at();

CREATE OR REPLACE FUNCTION update_brand_affinities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_affinities_timestamp
  BEFORE UPDATE ON brand_affinities
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_affinities_updated_at();

CREATE OR REPLACE FUNCTION update_user_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_features_timestamp
  BEFORE UPDATE ON user_features
  FOR EACH ROW
  EXECUTE FUNCTION update_user_features_updated_at();

CREATE OR REPLACE FUNCTION update_card_benefits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_card_benefits_timestamp
  BEFORE UPDATE ON card_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_card_benefits_updated_at();