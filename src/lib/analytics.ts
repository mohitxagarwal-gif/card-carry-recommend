// This file is deprecated - use safeAnalytics.ts instead
// Keeping for backward compatibility
import { safeTrackEvent } from "./safeAnalytics";

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  console.log('[Analytics]', eventName, properties);
  return safeTrackEvent(eventName, properties);
};
