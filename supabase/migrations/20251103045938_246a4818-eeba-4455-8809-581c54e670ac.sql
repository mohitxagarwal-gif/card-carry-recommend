-- Create site_content table for managing dynamic site content
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL UNIQUE,
  content jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Admins can manage site content
CREATE POLICY "Admins can manage site content"
ON public.site_content FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view site content
CREATE POLICY "Anyone can view site content"
ON public.site_content FOR SELECT
USING (true);

-- Create categories table for dynamic category management
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon_position text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Admins can manage categories
CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (is_active = true);

-- Create analytics_events table for tracking user interactions
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
ON public.analytics_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own events
CREATE POLICY "Users can insert their own events"
ON public.analytics_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_site_content_section ON public.site_content(section);

-- Create trigger for updating updated_at on site_content
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial categories from existing hardcoded data
INSERT INTO public.categories (name, slug, icon_position, display_order) VALUES
  ('tech & gadgets', 'tech-gadgets', '0% 0%', 1),
  ('banking', 'banking', '33.33% 0%', 2),
  ('travel', 'travel', '66.66% 0%', 3),
  ('dining', 'dining', '100% 0%', 4),
  ('entertainment', 'entertainment', '0% 33.33%', 5),
  ('photography', 'photography', '33.33% 33.33%', 6),
  ('home & living', 'home-living', '66.66% 33.33%', 7),
  ('fitness', 'fitness', '100% 33.33%', 8),
  ('audio', 'audio', '0% 66.66%', 9),
  ('food & grocery', 'food-grocery', '33.33% 66.66%', 10),
  ('electronics', 'electronics', '66.66% 66.66%', 11),
  ('fashion', 'fashion', '100% 66.66%', 12)
ON CONFLICT (name) DO NOTHING;

-- Seed initial site content from existing hardcoded data
INSERT INTO public.site_content (section, content) VALUES
  ('hero', '{"headline": "hello perks. bye fees.", "subheadline": "no jargon. no spam. card & carry matches you to cards based on your spending and the benefits you actually use.", "cta_text": "start my match", "secondary_cta": "browse all cards", "footer_text": "free • no impact on credit score • takes < 2 minutes"}'),
  ('how_it_works', '{"title": "how card & carry works", "steps": [{"number": "01", "title": "tell us your basics", "description": "spending categories, travel, dining, online shopping — share your habits with us."}, {"number": "02", "title": "we match your benefits", "description": "rewards, lounge, cashback, forex, co-brands — we find what fits your lifestyle."}, {"number": "03", "title": "compare & apply", "description": "fit score + clear fee/perk breakdown for confident decisions."}], "cta_text": "try the recommender →"}'),
  ('faq', '{"title": "frequently asked questions", "items": [{"question": "will checking cards affect my credit score?", "answer": "no. we don''t pull your credit file. our recommendations are based on your spending patterns and preferences, not your credit history. only when you apply for a card through the issuer''s website will there be a credit inquiry."}, {"question": "how do you rank cards?", "answer": "we analyze your spending patterns and match them with each card''s benefits. cards are scored based on how well their rewards, perks, and fees align with your actual usage. you can also sort by different criteria like annual fee, welcome bonus, or popularity to find what matters most to you."}, {"question": "do benefits change?", "answer": "yes. banks can modify card benefits, fees, and terms at any time. we strive to keep our database up-to-date and surface notable changes in each card''s detail page. however, always verify the current terms and conditions on the issuer''s official website before applying."}, {"question": "what fees matter?", "answer": "the main fees to consider are: annual/joining fee (can often be waived with spending), forex markup (for international transactions), cash withdrawal charges (avoid using credit cards for cash), and late payment fees (always pay on time). we highlight these key fees in our comparisons."}]}'),
  ('categories', '{"title": "analyzed by category", "description": "we understand your spending across twelve distinct lifestyle categories"}')
ON CONFLICT (section) DO NOTHING;