/**
 * Unified analytics bridge for dual tracking.
 * Sends events to both Supabase (analytics_events) and Mixpanel.
 * 
 * This allows gradual migration and validation of Mixpanel data.
 */
import { safeTrackEvent as supabaseTrackEvent } from "./safeAnalytics";
import { trackEvent as mixpanelTrackEvent } from "./mixpanel";

/**
 * Track an event to both Supabase and Mixpanel.
 * This is the single entry point for all analytics in the app.
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] Event:', eventName, properties);
  }
  
  // Send to Supabase (existing system)
  supabaseTrackEvent(eventName, properties);
  
  // Send to Mixpanel (new system)
  mixpanelTrackEvent(eventName, properties);
};

// Export for backward compatibility
export { safeTrackEvent } from "./safeAnalytics";
