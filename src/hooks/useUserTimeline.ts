import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: string;
  event_category: string;
  actor: 'user' | 'system' | 'admin';
  description: string;
  metadata: any;
  source: 'audit_log' | 'analytics_events' | 'system';
  severity?: string;
}

export const useUserTimeline = (
  userId: string | null,
  filters?: {
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
  }
) => {
  return useQuery({
    queryKey: ["user-timeline", userId, filters],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // Fetch audit log entries
      let auditQuery = supabase
        .from("audit_log")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (filters?.category) {
        auditQuery = auditQuery.eq("event_category", filters.category);
      }
      if (filters?.dateFrom) {
        auditQuery = auditQuery.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        auditQuery = auditQuery.lte("created_at", filters.dateTo);
      }

      const { data: auditLogs } = await auditQuery;

      // Fetch analytics events
      let analyticsQuery = supabase
        .from("analytics_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (filters?.dateFrom) {
        analyticsQuery = analyticsQuery.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        analyticsQuery = analyticsQuery.lte("created_at", filters.dateTo);
      }

      const { data: analyticsEvents } = await analyticsQuery;

      // Fetch system milestones
      const { data: analyses } = await supabase
        .from("spending_analyses")
        .select("id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const { data: snapshots } = await supabase
        .from("recommendation_snapshots")
        .select("id, created_at, confidence")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Convert all to timeline events
      const timeline: TimelineEvent[] = [];

      // Add audit log events
      auditLogs?.forEach(log => {
        timeline.push({
          id: log.id,
          timestamp: log.created_at,
          event_type: log.event_type,
          event_category: log.event_category || 'system',
          actor: log.actor as 'user' | 'system' | 'admin',
          description: formatEventDescription(log.event_type, log.metadata),
          metadata: log.metadata,
          source: 'audit_log',
          severity: log.severity || undefined
        });
      });

      // Add analytics events
      analyticsEvents?.forEach(event => {
        timeline.push({
          id: event.id,
          timestamp: event.created_at,
          event_type: event.event_type,
          event_category: categorizeAnalyticsEvent(event.event_type),
          actor: 'user',
          description: formatEventDescription(event.event_type, event.event_data),
          metadata: event.event_data,
          source: 'analytics_events'
        });
      });

      // Add system milestones
      analyses?.forEach(analysis => {
        timeline.push({
          id: analysis.id,
          timestamp: analysis.created_at,
          event_type: 'ANALYSIS_CREATED',
          event_category: 'statement',
          actor: 'system',
          description: 'Statement analysis completed',
          metadata: { analysis_id: analysis.id },
          source: 'system'
        });
      });

      snapshots?.forEach(snapshot => {
        timeline.push({
          id: snapshot.id,
          timestamp: snapshot.created_at,
          event_type: 'RECOMMENDATIONS_GENERATED',
          event_category: 'recommendation',
          actor: 'system',
          description: `Recommendations generated (${snapshot.confidence} confidence)`,
          metadata: { snapshot_id: snapshot.id, confidence: snapshot.confidence },
          source: 'system'
        });
      });

      // Sort by timestamp (newest first)
      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply search filter
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return timeline.filter(event => 
          event.event_type.toLowerCase().includes(term) ||
          event.description.toLowerCase().includes(term) ||
          JSON.stringify(event.metadata).toLowerCase().includes(term)
        );
      }

      return timeline;
    },
  });
};

function formatEventDescription(eventType: string, metadata: any): string {
  const descriptions: Record<string, string> = {
    'USER_SIGNUP': 'User signed up',
    'USER_LOGIN': 'User logged in',
    'USER_LOGOUT': 'User logged out',
    'ONBOARDING_COMPLETED': 'Completed onboarding',
    'CONSENT_GIVEN': 'Gave data processing consent',
    'STATEMENT_UPLOADED': `Uploaded statement: ${metadata?.fileName || 'file'}`,
    'RECOMMENDATIONS_VIEWED': 'Viewed recommendations',
    'CARD_SHORTLISTED': `Shortlisted card: ${metadata?.cardId || 'card'}`,
    'CARD_APPLICATION_CREATED': `Started application for: ${metadata?.cardId || 'card'}`,
    'DATA_EXPORT_REQUESTED': 'Exported user data',
    'DATA_DELETION_REQUESTED': 'Requested account deletion',
    'ADMIN_VIEW_USER_TIMELINE': `Admin ${metadata?.viewer_admin_id} viewed timeline`,
  };

  return descriptions[eventType] || eventType.replace(/_/g, ' ').toLowerCase();
}

function categorizeAnalyticsEvent(eventType: string): string {
  if (eventType.includes('login') || eventType.includes('signup') || eventType.includes('auth')) {
    return 'auth';
  }
  if (eventType.includes('onboarding')) {
    return 'onboarding';
  }
  if (eventType.includes('statement') || eventType.includes('upload') || eventType.includes('parse')) {
    return 'statement';
  }
  if (eventType.includes('recommendation') || eventType.includes('recs')) {
    return 'recommendation';
  }
  if (eventType.includes('card') || eventType.includes('shortlist') || eventType.includes('application')) {
    return 'card_action';
  }
  if (eventType.includes('export') || eventType.includes('delete') || eventType.includes('consent')) {
    return 'data_rights';
  }
  if (eventType.includes('admin')) {
    return 'admin';
  }
  if (eventType.includes('error') || eventType.includes('fail')) {
    return 'error';
  }
  return 'system';
}
