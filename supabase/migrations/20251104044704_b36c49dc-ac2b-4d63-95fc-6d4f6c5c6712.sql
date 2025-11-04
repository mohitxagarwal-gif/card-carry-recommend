-- Phase 6: Add timezone normalization to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';