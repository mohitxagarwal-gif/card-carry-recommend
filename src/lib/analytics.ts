export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  console.log('[Analytics]', eventName, properties);
};
