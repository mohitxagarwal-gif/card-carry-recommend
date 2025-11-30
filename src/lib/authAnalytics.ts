import { safeTrackEvent as trackEvent } from "./safeAnalytics";

export const trackAuthSuccess = (provider: 'google') => {
  trackEvent('auth_success', { provider });
};

export const trackAuthRedirectNext = (
  path: string, 
  reason: 'onboarding' | 'returnTo' | 'fallback' | 'has_recommendations'
) => {
  trackEvent('auth_redirect_next', { path, reason });
};

export const trackOnboardingGateTriggered = (missingFields: string[]) => {
  trackEvent('onboarding_gate_triggered', { 
    missingFields: missingFields.join(','),
    count: missingFields.length 
  });
};
