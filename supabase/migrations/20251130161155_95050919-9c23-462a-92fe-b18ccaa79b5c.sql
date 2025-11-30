-- One-time cleanup: Reset onboarding_completed for users stuck in broken state
-- (users with onboarding_completed=true but no recommendation snapshot)

DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Find and reset users with onboarding_completed=true but no snapshot
  WITH broken_users AS (
    SELECT p.id 
    FROM public.profiles p
    LEFT JOIN public.recommendation_snapshots rs ON p.id = rs.user_id
    WHERE p.onboarding_completed = true
    AND rs.id IS NULL
  )
  UPDATE public.profiles
  SET 
    onboarding_completed = false,
    onboarding_completed_at = null,
    updated_at = now()
  WHERE id IN (SELECT id FROM broken_users);
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log to audit trail (using allowed event_category value)
  INSERT INTO public.audit_log (
    actor,
    event_type,
    event_category,
    severity,
    metadata
  ) VALUES (
    'system',
    'ONBOARDING_STATE_CLEANUP',
    'system',  -- Changed from 'data_integrity' to 'system'
    'info',
    jsonb_build_object(
      'users_reset', affected_count,
      'reason', 'onboarding_completed_without_snapshot',
      'timestamp', now()
    )
  );
  
  RAISE NOTICE 'Reset onboarding_completed for % users', affected_count;
END $$;