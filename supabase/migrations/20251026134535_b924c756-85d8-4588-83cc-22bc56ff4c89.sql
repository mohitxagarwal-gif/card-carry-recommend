-- Create recommendation_snapshots table
CREATE TABLE public.recommendation_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.spending_analyses(id) ON DELETE CASCADE,
  savings_min INTEGER NOT NULL,
  savings_max INTEGER NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  recommended_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_shortlist table
CREATE TABLE public.user_shortlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- Create card_applications table
CREATE TABLE public.card_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'considering' CHECK (status IN ('considering', 'applied', 'approved', 'rejected')),
  applied_date TIMESTAMP WITH TIME ZONE,
  status_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  issuer_link TEXT,
  docs_checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_cards table
CREATE TABLE public.user_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  opened_month TEXT,
  renewal_month TEXT,
  forex_pct NUMERIC,
  lounge_quota_total INTEGER DEFAULT 0,
  lounge_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fee_waiver_goals table
CREATE TABLE public.fee_waiver_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  target_amount INTEGER NOT NULL,
  current_amount INTEGER DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id, year)
);

-- Create user_reminders table
CREATE TABLE public.user_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('bill_due', 'annual_fee', 'bonus_expiry', 'lounge_reset')),
  reminder_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_feed table
CREATE TABLE public.content_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  url TEXT,
  target_income_bands TEXT[] DEFAULT ARRAY[]::TEXT[],
  target_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_evergreen BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  fee_sensitivity TEXT CHECK (fee_sensitivity IN ('low', 'medium', 'high')),
  travel_frequency TEXT CHECK (travel_frequency IN ('never', 'occasional', 'frequent')),
  lounge_importance TEXT CHECK (lounge_importance IN ('low', 'medium', 'high')),
  preference_type TEXT CHECK (preference_type IN ('cashback', 'points', 'both')),
  email_reminders BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.recommendation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_waiver_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendation_snapshots
CREATE POLICY "Users can view their own snapshots"
  ON public.recommendation_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snapshots"
  ON public.recommendation_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshots"
  ON public.recommendation_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_shortlist
CREATE POLICY "Users can view their own shortlist"
  ON public.user_shortlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their shortlist"
  ON public.user_shortlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their shortlist"
  ON public.user_shortlist FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for card_applications
CREATE POLICY "Users can view their own applications"
  ON public.card_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
  ON public.card_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON public.card_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
  ON public.card_applications FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_cards
CREATE POLICY "Users can view their own cards"
  ON public.user_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON public.user_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON public.user_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON public.user_cards FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for fee_waiver_goals
CREATE POLICY "Users can view their own goals"
  ON public.fee_waiver_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.fee_waiver_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.fee_waiver_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.fee_waiver_goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_reminders
CREATE POLICY "Users can view their own reminders"
  ON public.user_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.user_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON public.user_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON public.user_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for content_feed (public read)
CREATE POLICY "Anyone can view content"
  ON public.content_feed FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage content"
  ON public.content_feed FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_recommendation_snapshots_updated_at
  BEFORE UPDATE ON public.recommendation_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_card_applications_updated_at
  BEFORE UPDATE ON public.card_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_cards_updated_at
  BEFORE UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_waiver_goals_updated_at
  BEFORE UPDATE ON public.fee_waiver_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_recommendation_snapshots_user_id ON public.recommendation_snapshots(user_id);
CREATE INDEX idx_recommendation_snapshots_analysis_id ON public.recommendation_snapshots(analysis_id);
CREATE INDEX idx_user_shortlist_user_id ON public.user_shortlist(user_id);
CREATE INDEX idx_card_applications_user_id ON public.card_applications(user_id);
CREATE INDEX idx_card_applications_status ON public.card_applications(status);
CREATE INDEX idx_user_cards_user_id ON public.user_cards(user_id);
CREATE INDEX idx_fee_waiver_goals_user_id ON public.fee_waiver_goals(user_id);
CREATE INDEX idx_user_reminders_user_id ON public.user_reminders(user_id);
CREATE INDEX idx_user_reminders_date ON public.user_reminders(reminder_date) WHERE dismissed = false;