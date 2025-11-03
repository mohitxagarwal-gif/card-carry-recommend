-- Merchant intelligence table with comprehensive categorization
CREATE TABLE IF NOT EXISTS public.merchant_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Merchant identification
  merchant_raw VARCHAR(500) NOT NULL UNIQUE,
  merchant_normalized VARCHAR(200) NOT NULL,
  merchant_canonical VARCHAR(200),
  
  -- Categorization
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Metadata
  merchant_type VARCHAR(50),
  keywords TEXT[],
  aliases TEXT[],
  
  -- AI confidence scoring
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  last_verified_at TIMESTAMPTZ,
  
  -- Usage tracking
  transaction_count INTEGER DEFAULT 1,
  total_amount DECIMAL(15,2) DEFAULT 0,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_merchant_raw ON public.merchant_intelligence(LOWER(merchant_raw));
CREATE INDEX idx_merchant_normalized ON public.merchant_intelligence(merchant_normalized);
CREATE INDEX idx_keywords_gin ON public.merchant_intelligence USING GIN(keywords);
CREATE INDEX idx_category ON public.merchant_intelligence(category);

-- Full-text search index
CREATE INDEX idx_merchant_fulltext ON public.merchant_intelligence 
  USING GIN(to_tsvector('english', merchant_normalized || ' ' || COALESCE(merchant_canonical, '')));

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_merchant_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

CREATE TRIGGER update_merchant_intelligence_timestamp
  BEFORE UPDATE ON public.merchant_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_merchant_intelligence_updated_at();

-- Seed with common Indian merchants
INSERT INTO public.merchant_intelligence (merchant_raw, merchant_normalized, merchant_canonical, category, subcategory, merchant_type, keywords, confidence_score) VALUES
-- Groceries & Essentials
('firstclub', 'FirstClub', 'FirstClub', 'groceries', 'online-grocery', 'e-commerce', ARRAY['first', 'club', 'grocery', 'essentials'], 1.00),
('zepto marketplace', 'Zepto', 'Zepto', 'groceries', 'quick-commerce', 'e-commerce', ARRAY['zepto', 'grocery', '10-minute', 'delivery'], 1.00),
('swiggy instamart', 'Swiggy Instamart', 'Swiggy', 'groceries', 'quick-commerce', 'e-commerce', ARRAY['swiggy', 'instamart', 'grocery'], 1.00),
('blinkit', 'Blinkit', 'Blinkit', 'groceries', 'quick-commerce', 'e-commerce', ARRAY['blinkit', 'grofers', 'grocery'], 1.00),
('bigbasket', 'BigBasket', 'BigBasket', 'groceries', 'online-grocery', 'e-commerce', ARRAY['bigbasket', 'bb', 'grocery'], 1.00),
('dmart ready', 'DMart Ready', 'DMart', 'groceries', 'online-grocery', 'e-commerce', ARRAY['dmart', 'avenue', 'supermarket'], 1.00),

-- Food Delivery
('swiggy', 'Swiggy', 'Swiggy', 'food & dining', 'food-delivery', 'e-commerce', ARRAY['swiggy', 'food', 'delivery'], 1.00),
('zomato', 'Zomato', 'Zomato', 'food & dining', 'food-delivery', 'e-commerce', ARRAY['zomato', 'food', 'delivery'], 1.00),

-- Transportation
('uber', 'Uber', 'Uber', 'transportation', 'ride-hailing', 'service', ARRAY['uber', 'taxi', 'cab'], 1.00),
('ola cabs', 'Ola', 'Ola', 'transportation', 'ride-hailing', 'service', ARRAY['ola', 'taxi', 'cab'], 1.00),
('rapido', 'Rapido', 'Rapido', 'transportation', 'bike-taxi', 'service', ARRAY['rapido', 'bike', 'taxi'], 1.00),

-- E-commerce
('amazon', 'Amazon', 'Amazon', 'shopping & e-commerce', 'marketplace', 'e-commerce', ARRAY['amazon', 'shopping', 'online'], 1.00),
('flipkart', 'Flipkart', 'Flipkart', 'shopping & e-commerce', 'marketplace', 'e-commerce', ARRAY['flipkart', 'shopping'], 1.00),
('myntra', 'Myntra', 'Myntra', 'shopping & e-commerce', 'fashion', 'e-commerce', ARRAY['myntra', 'fashion', 'clothing'], 1.00),

-- Entertainment
('netflix', 'Netflix', 'Netflix', 'entertainment', 'streaming', 'subscription', ARRAY['netflix', 'streaming', 'movies'], 1.00),
('spotify', 'Spotify', 'Spotify', 'entertainment', 'music-streaming', 'subscription', ARRAY['spotify', 'music', 'audio'], 1.00),
('hotstar', 'Hotstar', 'Disney+ Hotstar', 'entertainment', 'streaming', 'subscription', ARRAY['hotstar', 'disney', 'streaming'], 1.00),

-- Financial Services
('paytm', 'Paytm', 'Paytm', 'financial services', 'payment-gateway', 'fintech', ARRAY['paytm', 'wallet', 'payment'], 1.00),
('phonepe', 'PhonePe', 'PhonePe', 'financial services', 'payment-gateway', 'fintech', ARRAY['phonepe', 'upi', 'payment'], 1.00),
('googlepay', 'Google Pay', 'Google Pay', 'financial services', 'payment-gateway', 'fintech', ARRAY['gpay', 'google', 'upi'], 1.00)
ON CONFLICT (merchant_raw) DO NOTHING;

-- RLS Policies (public read for AI lookups)
ALTER TABLE public.merchant_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for merchant lookup"
  ON public.merchant_intelligence
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to suggest merchants"
  ON public.merchant_intelligence
  FOR INSERT
  TO authenticated
  WITH CHECK (true);