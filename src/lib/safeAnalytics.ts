import { supabase } from "@/integrations/supabase/client";

// Sensitive field patterns to remove/redact
const SENSITIVE_PATTERNS = [
  'password', 'pwd', 'passwd',
  'token', 'api_key', 'secret', 'apikey',
  'cvv', 'cvc', 'card_number', 'pan', 'cardnumber',
  'otp', 'verification_code', 'verificationcode',
  'account_number', 'routing_number', 'accountnumber',
  'ssn', 'social_security',
  'statement_text', 'raw_text', 'rawtext'
];

// Patterns that might contain card numbers or OTPs
const REDACT_PATTERNS = [
  /\b\d{13,19}\b/g, // Card numbers (13-19 digits)
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Formatted card numbers
  /\b\d{4,6}\b/g, // OTP codes
  /\b[A-Z0-9]{20,}\b/g, // Long tokens
];

function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    // Redact patterns
    let sanitized = value;
    REDACT_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    return sanitized;
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  
  if (value && typeof value === 'object') {
    return sanitizePayload(value);
  }
  
  return value;
}

function sanitizePayload(payload: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    
    // Drop sensitive keys entirely
    if (SENSITIVE_PATTERNS.some(pattern => lowerKey.includes(pattern))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize nested objects
    sanitized[key] = sanitizeValue(value);
  }
  
  return sanitized;
}

export async function safeTrackEvent(
  eventType: string, 
  eventData?: Record<string, any>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const sanitizedData = eventData ? sanitizePayload(eventData) : {};
    
    const { error } = await supabase
      .from("analytics_events")
      .insert({
        user_id: user?.id || null,
        event_type: eventType,
        event_data: sanitizedData,
      });
    
    if (error) {
      console.error("[safeTrackEvent] Failed to log event:", error);
      // Don't throw - analytics should never break app functionality
    }
  } catch (err) {
    console.error("[safeTrackEvent] Exception:", err);
  }
}

// For backward compatibility - deprecated but still works
export function trackEvent(eventType: string, eventData?: Record<string, any>) {
  return safeTrackEvent(eventType, eventData);
}
