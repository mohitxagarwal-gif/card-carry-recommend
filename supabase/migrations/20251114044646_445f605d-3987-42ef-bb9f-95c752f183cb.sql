-- Phase 1A: Add audit_log table and consent tracking to profiles

-- Create audit_log table for tracking all user and system events
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor TEXT NOT NULL CHECK (actor IN ('user', 'system', 'admin')),
  event_type TEXT NOT NULL,
  event_category TEXT CHECK (event_category IN ('auth', 'statement', 'analysis', 'recommendation', 'card_action', 'data_rights', 'admin', 'system')),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  metadata JSONB DEFAULT '{}'::jsonb,
  request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for common queries
CREATE INDEX idx_audit_log_user_id_created_at ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX idx_audit_log_event_category ON public.audit_log(event_category);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_request_id ON public.audit_log(request_id) WHERE request_id IS NOT NULL;

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert audit logs (for frontend events)
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add consent tracking fields to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS data_processing_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_processing_consent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT;

-- Create index for consent queries
CREATE INDEX idx_profiles_consent ON public.profiles(data_processing_consent, data_processing_consent_at);