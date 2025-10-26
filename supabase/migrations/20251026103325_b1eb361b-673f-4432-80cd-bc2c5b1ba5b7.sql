-- Add onboarding-specific fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS income_band_inr TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for onboarding status
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON public.profiles(onboarding_completed);

-- Add check constraint for age_range
ALTER TABLE public.profiles
ADD CONSTRAINT check_age_range 
CHECK (age_range IS NULL OR age_range IN ('18-24', '25-34', '35-44', '45-54', '55+'));

-- Add check constraint for income_band_inr
ALTER TABLE public.profiles
ADD CONSTRAINT check_income_band 
CHECK (income_band_inr IS NULL OR income_band_inr IN ('0-25000', '25000-50000', '50000-100000', '100000-200000', '200000+'));

-- Create table for OTP verification
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, phone_e164, otp_code)
);

-- Enable RLS on phone_verifications
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can view their own phone verifications
CREATE POLICY "Users can view their own phone verifications"
ON public.phone_verifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy: users can insert their own verifications
CREATE POLICY "Users can create their own phone verifications"
ON public.phone_verifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add indexes for efficient OTP lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_phone 
ON public.phone_verifications(user_id, phone_e164, otp_code) 
WHERE NOT verified;

CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at 
ON public.phone_verifications(expires_at);

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_phone_verifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.phone_verifications
  WHERE expires_at < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;