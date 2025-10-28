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
  console.log('[authUtils.ts:39] isOnboardingComplete called');
  if (!profile) {
    console.log('[authUtils.ts:41] No profile provided');
    return false;
  }
  
  const hasAge = !!profile.age_range;
  const hasIncome = !!profile.income_band_inr;
  const hasPhone = !!profile.phone_e164;
  
  console.log('[authUtils.ts:49] Onboarding field check:', {
    age_range: hasAge,
    income_band_inr: hasIncome,
    phone_e164: hasPhone
  });
  
  const isComplete = !!(hasAge && hasIncome && hasPhone);
  console.log('[authUtils.ts:56] Result:', isComplete);
  
  return isComplete;
};

/**
 * Polls the profiles table until the profile exists
 * Waits up to 1.5 seconds (10 attempts x 150ms)
 */
export const waitForProfile = async (
  userId: string,
  maxAttempts: number = 10
): Promise<Profile | null> => {
  console.log('[authUtils.ts:55] waitForProfile started for userId:', userId);
  console.log('[authUtils.ts:56] Max attempts:', maxAttempts);
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    console.log(`[authUtils.ts:60] Profile polling attempt ${attempts + 1}/${maxAttempts}`);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, age_range, income_band_inr, phone_e164, city, onboarding_completed")
      .eq("id", userId)
      .single();
    
    console.log(`[authUtils.ts:67] Attempt ${attempts + 1} result:`, {
      hasData: !!data,
      hasError: !!error,
      error: error?.message,
      data: data
    });
    
    if (data && !error) {
      console.log('[authUtils.ts:74] Profile found successfully:', data);
      return data as Profile;
    }
    
    console.log(`[authUtils.ts:78] Profile not found, waiting 150ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, 150));
    attempts++;
  }
  
  console.error('[authUtils.ts:83] Profile not found after all attempts');
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
  console.log('[authUtils.ts:90] afterAuthRedirect called');
  console.log('[authUtils.ts:91] Parameters:', { userId, returnTo });
  
  // Wait for profile to exist
  console.log('[authUtils.ts:94] Waiting for profile...');
  const profile = await waitForProfile(userId);
  
  console.log('[authUtils.ts:97] Profile result:', profile ? 'Profile found' : 'Profile not found');
  
  if (!profile) {
    console.error('[authUtils.ts:100] Profile not found after authentication');
    throw new Error("Profile not found after authentication");
  }
  
  console.log('[authUtils.ts:104] Profile data:', profile);
  console.log('[authUtils.ts:105] Checking onboarding completion...');
  const isComplete = isOnboardingComplete(profile);
  console.log('[authUtils.ts:107] Onboarding complete:', isComplete);
  
  const safe = sanitizeInternalPath(returnTo) || '/upload';
  console.log('[authUtils.ts:110] Safe redirect path:', safe);
  
  if (!isComplete) {
    console.log('[authUtils.ts:113] Onboarding incomplete, redirecting to onboarding');
    
    // Track missing fields for telemetry
    const missingFields: string[] = [];
    if (!profile.age_range) missingFields.push('age_range');
    if (!profile.income_band_inr) missingFields.push('income_band_inr');
    if (!profile.phone_e164) missingFields.push('phone_e164');
    
    console.log('[authUtils.ts:121] Missing fields:', missingFields);
    
    trackOnboardingGateTriggered(missingFields);
    trackAuthRedirectNext(`/onboarding/basics?returnTo=${encodeURIComponent(safe)}`, 'onboarding');
    
    console.log('[authUtils.ts:126] Navigating to /onboarding/basics');
    navigate(`/onboarding/basics?returnTo=${encodeURIComponent(safe)}`, { replace: true });
  } else {
    console.log('[authUtils.ts:129] Onboarding complete, redirecting to destination');
    const reason = returnTo ? 'returnTo' : 'fallback';
    console.log('[authUtils.ts:131] Redirect reason:', reason);
    
    trackAuthRedirectNext(safe, reason);
    console.log('[authUtils.ts:134] Navigating to:', safe);
    navigate(safe, { replace: true });
  }
  
  console.log('[authUtils.ts:138] afterAuthRedirect completed');
};

/**
 * Reads the returnTo query parameter from current URL
 */
export const getReturnToFromQuery = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  return sanitizeInternalPath(returnTo);
};
