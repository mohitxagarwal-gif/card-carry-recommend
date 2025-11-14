import { supabase } from "@/integrations/supabase/client";
import type { AuditLogInsert } from "@/types/supabase-extended";

export type AuditEventCategory = 
  | 'auth'
  | 'statement'
  | 'analysis'
  | 'recommendation'
  | 'card_action'
  | 'data_rights'
  | 'admin'
  | 'system';

export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type AuditActor = 'user' | 'system' | 'admin';

interface AuditLogEntry {
  user_id?: string;
  actor: AuditActor;
  event_type: string;
  event_category?: AuditEventCategory;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
  request_id?: string;
}

/**
 * Sanitizes metadata to remove sensitive fields before logging
 */
function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sensitive_patterns = [
    /password/i,
    /cvv/i,
    /pan/i,
    /card_number/i,
    /otp/i,
    /token/i,
    /secret/i,
    /api_key/i,
    /account_number/i,
    /ssn/i,
    /statement_text/i
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Check if key matches sensitive patterns
    const isSensitive = sensitive_patterns.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log an audit event from the frontend
 */
export async function logAuditEvent(
  eventType: string,
  options: {
    category?: AuditEventCategory;
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
    requestId?: string;
  } = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const entry: AuditLogEntry = {
      user_id: user?.id,
      actor: 'user',
      event_type: eventType,
      event_category: options.category,
      severity: options.severity || 'info',
      metadata: options.metadata ? sanitizeMetadata(options.metadata) : {},
      request_id: options.requestId
    };

    const { error } = await supabase
      .from("audit_log" as any)
      .insert(entry);

    if (error) {
      console.error('[AuditLog] Failed to log event:', error);
    }
  } catch (error) {
    console.error('[AuditLog] Error logging audit event:', error);
  }
}

/**
 * Log multiple audit events in batch
 */
export async function logAuditEvents(
  events: Array<{
    eventType: string;
    category?: AuditEventCategory;
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
  }>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const entries = events.map(event => ({
      user_id: user?.id,
      actor: 'user' as AuditActor,
      event_type: event.eventType,
      event_category: event.category,
      severity: event.severity || 'info',
      metadata: event.metadata ? sanitizeMetadata(event.metadata) : {}
    }));

    const { error } = await supabase
      .from("audit_log" as any)
      .insert(entries);

    if (error) {
      console.error('[AuditLog] Failed to log batch events:', error);
    }
  } catch (error) {
    console.error('[AuditLog] Error logging batch audit events:', error);
  }
}
