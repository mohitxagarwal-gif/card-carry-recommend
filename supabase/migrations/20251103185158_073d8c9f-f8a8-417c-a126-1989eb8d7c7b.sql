-- Fix the critical bug in handle_new_user() trigger
-- Previous migration incorrectly referenced 'user_id' column which doesn't exist
-- The profiles table uses 'id' as primary key, and 'email' is a required NOT NULL field

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,  -- Correct column name (not user_id)
    email,  -- Required NOT NULL field from auth.users
    full_name,
    onboarding_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,  -- Get email from auth.users table
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;