import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

export type AuditEventCategory =
  | "auth"
  | "statement"
  | "analysis"
  | "recommendation"
  | "card_action"
  | "data_rights"
  | "admin"
  | "system";

export type AuditSeverity = "debug" | "info" | "warning" | "error" | "critical";

export type AuditActor = "user" | "system" | "admin";

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
  const sensitivePatterns = [
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
    /statement_text/i,
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const isSensitive = sensitivePatterns.some((pattern) => pattern.test(key));

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log an audit event from edge functions
 * Uses service role client to bypass RLS
 */
export async function logAuditEvent(
  supabaseClient: SupabaseClient,
  eventType: string,
  options: {
    userId?: string;
    actor?: AuditActor;
    category?: AuditEventCategory;
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
    requestId?: string;
  } = {},
): Promise<void> {
  try {
    const entry: AuditLogEntry = {
      user_id: options.userId,
      actor: options.actor || "system",
      event_type: eventType,
      event_category: options.category,
      severity: options.severity || "info",
      metadata: options.metadata ? sanitizeMetadata(options.metadata) : {},
      request_id: options.requestId,
    };

    const { error } = await supabaseClient
      .from("audit_log")
      .insert(entry);

    if (error) {
      console.error("[AuditLog] Failed to log event:", error);
    }
  } catch (error) {
    console.error("[AuditLog] Error logging audit event:", error);
  }
}

/**
 * Log multiple audit events in batch
 */
export async function logAuditEvents(
  supabaseClient: SupabaseClient,
  events: Array<{
    userId?: string;
    actor?: AuditActor;
    eventType: string;
    category?: AuditEventCategory;
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
  }>,
): Promise<void> {
  try {
    const entries = events.map((event) => ({
      user_id: event.userId,
      actor: event.actor || "system" as AuditActor,
      event_type: event.eventType,
      event_category: event.category,
      severity: event.severity || "info",
      metadata: event.metadata ? sanitizeMetadata(event.metadata) : {},
    }));

    const { error } = await supabaseClient
      .from("audit_log")
      .insert(entries);

    if (error) {
      console.error("[AuditLog] Failed to log batch events:", error);
    }
  } catch (error) {
    console.error("[AuditLog] Error logging batch audit events:", error);
  }
}
