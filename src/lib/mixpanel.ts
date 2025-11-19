import mixpanel, { Dict } from 'mixpanel-browser';

// Type for initialization status
let isInitialized = false;

/**
 * ⚠️ PRIVACY NOTICE ⚠️
 * 
 * This module handles user tracking via Mixpanel.
 * 
 * NEVER send the following PII to Mixpanel:
 * - Email addresses
 * - Phone numbers
 * - Full names
 * - Exact city/location (use tiers)
 * - Raw transaction merchant names
 * - Exact PIN codes
 * - Credit card numbers
 * - Any other personally identifiable information
 * 
 * Always use:
 * - Aggregated values (buckets, ranges, tiers)
 * - Boolean flags
 * - Counts and metrics
 * - Anonymized categories
 */

/**
 * Initialize Mixpanel with token from environment variables.
 * Safe to call multiple times (idempotent).
 * Only works in browser context.
 */
export function initMixpanel(): void {
  // Skip if not in browser
  if (typeof window === 'undefined') {
    console.warn('[Mixpanel] Not in browser context, skipping init');
    return;
  }

  // Skip if already initialized
  if (isInitialized) {
    return;
  }

  const token = import.meta.env.VITE_MIXPANEL_TOKEN;

  if (!token) {
    console.warn('[Mixpanel] VITE_MIXPANEL_TOKEN not configured, tracking disabled');
    return;
  }

  try {
    mixpanel.init(token, {
      debug: import.meta.env.DEV,
      track_pageview: false, // We'll handle this manually
      persistence: 'localStorage',
      ignore_dnt: false, // Respect Do Not Track
      autocapture: true, // Auto-track user interactions
      record_sessions_percent: 100, // Record 100% of sessions for replay
    });
    
    isInitialized = true;
    console.log('[Mixpanel] Initialized successfully');
  } catch (error) {
    console.error('[Mixpanel] Initialization failed:', error);
  }
}

/**
 * Identify a user and set their ID for tracking.
 * Call this after successful login/signup.
 */
export function identifyUser(userId: string, traits?: Dict): void {
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.identify(userId);
    
    if (traits) {
      mixpanel.people.set(traits);
    }
    
    console.log('[Mixpanel] User identified:', userId);
  } catch (error) {
    console.error('[Mixpanel] Error identifying user:', error);
  }
}

/**
 * Set user properties (people properties in Mixpanel).
 * Use for demographic data, preferences, etc.
 * 
 * IMPORTANT: Never include PII (email, phone, full name, exact location).
 */
export function setUserProperties(properties: Dict): void {
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.people.set(properties);
    console.log('[Mixpanel] User properties set');
  } catch (error) {
    console.error('[Mixpanel] Error setting user properties:', error);
  }
}

/**
 * Track an event with optional properties.
 * This is the main method for tracking user actions.
 */
export function trackEvent(eventName: string, properties?: Dict): void {
  if (!isInitialized) {
    // Silently skip if not initialized (don't spam console)
    return;
  }

  try {
    mixpanel.track(eventName, properties);
  } catch (error) {
    console.error('[Mixpanel] Error tracking event:', error);
  }
}

/**
 * Track a page view event.
 * Call this on route changes.
 */
export function trackPageView(path: string, properties?: Dict): void {
  trackEvent('page_view', {
    path,
    ...properties,
  });
}

/**
 * Reset Mixpanel state (call on logout).
 * Clears user identification and local storage.
 */
export function resetMixpanel(): void {
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.reset();
    console.log('[Mixpanel] State reset');
  } catch (error) {
    console.error('[Mixpanel] Error resetting:', error);
  }
}

/**
 * Opt user out of tracking.
 */
export function optOut(): void {
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.opt_out_tracking();
    console.log('[Mixpanel] User opted out');
  } catch (error) {
    console.error('[Mixpanel] Error opting out:', error);
  }
}

/**
 * Opt user back in to tracking.
 */
export function optIn(): void {
  if (!isInitialized) {
    return;
  }

  try {
    mixpanel.opt_in_tracking();
    console.log('[Mixpanel] User opted in');
  } catch (error) {
    console.error('[Mixpanel] Error opting in:', error);
  }
}

/**
 * Build sanitized user properties from profile data.
 * IMPORTANT: This function ensures NO PII is sent to Mixpanel.
 */
export function buildUserProperties(
  profile: any,
  preferences: any,
  features: any
): Dict {
  // Derive city tier (anonymize exact city) - NOT the actual city name
  const cityTier = profile?.city 
    ? (profile.city.length > 0 ? 'tier_1_2' : 'not_provided') 
    : 'not_provided';

  // Derive monthly spend bucket from features
  const monthlySpendBucket = features?.monthly_spend_estimate
    ? features.monthly_spend_estimate < 25000 ? '<25k'
      : features.monthly_spend_estimate < 50000 ? '25-50k'
      : features.monthly_spend_estimate < 100000 ? '50-100k'
      : features.monthly_spend_estimate < 200000 ? '100-200k'
      : '200k+'
    : 'unknown';

  return {
    // Profile data (anonymized - NO email, phone, name, exact city)
    ageRange: profile?.age_range || 'not_provided',
    incomeBand: profile?.income_band_inr || 'not_provided',
    cityTier, // NOT the actual city name
    employmentType: profile?.employment_type || 'not_provided',
    
    // Onboarding status
    hasCompletedOnboarding: profile?.onboarding_completed || false,
    profileCompletionPercentage: profile?.profile_completion_percentage || 0,
    
    // Consent flags
    dataProcessingConsent: profile?.data_processing_consent || false,
    marketingConsent: profile?.marketing_consent || false,
    
    // Spending insights (aggregated)
    monthlySpendBucket,
    dataSource: features?.data_source || 'unknown',
    featureConfidence: features?.feature_confidence || 0,
    monthsCoverage: features?.months_coverage || 0,
    
    // Preferences (behavioral, not PII)
    feeSensitivity: preferences?.fee_sensitivity || 'not_set',
    travelFrequency: preferences?.travel_frequency || 'not_set',
    loungeImportance: preferences?.lounge_importance || 'not_set',
    rewardPreference: preferences?.reward_preference || 'not_set',
    
    // System metadata
    timezone: profile?.timezone || 'Asia/Kolkata',
  };
}
