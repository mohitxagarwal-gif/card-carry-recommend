-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create credit_cards table
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  network TEXT NOT NULL,
  annual_fee INTEGER NOT NULL,
  waiver_rule TEXT,
  welcome_bonus TEXT NOT NULL,
  reward_type TEXT[] NOT NULL,
  reward_structure TEXT NOT NULL,
  key_perks TEXT[] NOT NULL,
  lounge_access TEXT NOT NULL,
  forex_markup TEXT NOT NULL,
  forex_markup_pct NUMERIC NOT NULL,
  ideal_for TEXT[] NOT NULL,
  downsides TEXT[] NOT NULL,
  category_badges TEXT[] NOT NULL,
  image_url TEXT,
  eligibility TEXT,
  docs_required TEXT,
  tnc_url TEXT,
  popular_score INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on credit_cards
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_cards
CREATE POLICY "Anyone can view active cards"
ON public.credit_cards
FOR SELECT
TO authenticated, anon
USING (is_active = true);

CREATE POLICY "Admins can insert cards"
ON public.credit_cards
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cards"
ON public.credit_cards
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cards"
ON public.credit_cards
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_credit_cards_updated_at
BEFORE UPDATE ON public.credit_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();