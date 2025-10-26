import { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackAuthRedirectNext, trackOnboardingGateTriggered } from "./authAnalytics";

export interface Profile {
  id: string;
  age_range: string | null;
  income_band_inr: string | null;
  phone_e164: string | null;
  city: string | null;
  onboarding_completed: boolean | null;
}

/**
 * Validates that a path is internal and safe to redirect to
 */
export const sanitizeInternalPath = (path: string | null): string | null => {
  if (!path) return null;
  
  // Must start with / to be internal
  if (!path.startsWith('/')) return null;
  
  // Block protocol-relative URLs
  if (path.startsWith('//')) return null;
  
  // Block javascript: and data: URLs
  if (path.match(/^(javascript|data):/i)) return null;
  
  return path;
};

/**
 * Checks if user has completed onboarding requirements
 * Required: age_range, income_band_inr, phone_e164
 * Optional: city
 */
export const isOnboardingComplete = (profile: Profile | null): boolean => {
  if (!profile) return false;
  
  return !!(
    profile.age_range &&
    profile.income_band_inr &&
    profile.phone_e164
  );
};

/**
 * Polls the profiles table until the profile exists
 * Waits up to 1.5 seconds (10 attempts x 150ms)
 */
export const waitForProfile = async (
  userId: string,
  maxAttempts: number = 10
): Promise<Profile | null> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, age_range, income_band_inr, phone_e164, city, onboarding_completed")
      .eq("id", userId)
      .single();
    
    if (data && !error) {
      return data as Profile;
    }
    
    await new Promise(resolve => setTimeout(resolve, 150));
    attempts++;
  }
  
  return null;
};

/**
 * Determines where to redirect after authentication
 * Logic:
 * - If onboarding incomplete -> /onboarding/basics?returnTo=<safe>
 * - If onboarding complete -> <returnTo> or /upload
 */
export const afterAuthRedirect = async (
  userId: string,
  returnTo: string | null,
  navigate: NavigateFunction
): Promise<void> => {
  // Wait for profile to exist
  const profile = await waitForProfile(userId);
  
  if (!profile) {
    throw new Error("Profile not found after authentication");
  }
  
  const isComplete = isOnboardingComplete(profile);
  const safe = sanitizeInternalPath(returnTo) || '/upload';
  
  if (!isComplete) {
    // Track missing fields for telemetry
    const missingFields: string[] = [];
    if (!profile.age_range) missingFields.push('age_range');
    if (!profile.income_band_inr) missingFields.push('income_band_inr');
    if (!profile.phone_e164) missingFields.push('phone_e164');
    
    trackOnboardingGateTriggered(missingFields);
    trackAuthRedirectNext(`/onboarding/basics?returnTo=${encodeURIComponent(safe)}`, 'onboarding');
    
    navigate(`/onboarding/basics?returnTo=${encodeURIComponent(safe)}`, { replace: true });
  } else {
    const reason = returnTo ? 'returnTo' : 'fallback';
    trackAuthRedirectNext(safe, reason);
    navigate(safe, { replace: true });
  }
};

/**
 * Reads the returnTo query parameter from current URL
 */
export const getReturnToFromQuery = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  return sanitizeInternalPath(returnTo);
};
