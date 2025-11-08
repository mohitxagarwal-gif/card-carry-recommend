-- Add affiliate tracking fields to credit_cards
ALTER TABLE public.credit_cards 
ADD COLUMN IF NOT EXISTS affiliate_partner text,
ADD COLUMN IF NOT EXISTS affiliate_commission_rate numeric(5,2);

-- Add profile completion tracking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0;

-- Add card view tracking for analytics
CREATE TABLE IF NOT EXISTS public.card_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  card_id text NOT NULL,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  source text -- 'recommendations', 'explore', 'search', etc.
);

ALTER TABLE public.card_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own views"
ON public.card_views FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all card views"
ON public.card_views FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add affiliate click tracking
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  card_id text NOT NULL,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  utm_source text,
  utm_medium text,
  utm_campaign text
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own clicks"
ON public.affiliate_clicks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all clicks"
ON public.affiliate_clicks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_card_views_card_id ON public.card_views(card_id);
CREATE INDEX IF NOT EXISTS idx_card_views_viewed_at ON public.card_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_card_id ON public.affiliate_clicks(card_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at DESC);