import { supabase } from "@/integrations/supabase/client";
import { logAuditEvent } from "./auditLog";

export const ANALYSIS_EXPIRY_DAYS = 30;

export async function cleanupStaleAnalyses(userId: string) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - ANALYSIS_EXPIRY_DAYS);
  
  // Only delete analyses that have no associated snapshots
  const { data: analysesWithoutSnapshots } = await supabase
    .from('spending_analyses')
    .select('id')
    .eq('user_id', userId)
    .lt('created_at', expiryDate.toISOString());
  
  if (analysesWithoutSnapshots && analysesWithoutSnapshots.length > 0) {
    const analysisIds = analysesWithoutSnapshots.map(a => a.id);
    
    const { data: snapshots } = await supabase
      .from('recommendation_snapshots')
      .select('analysis_id')
      .in('analysis_id', analysisIds);
    
    const idsWithSnapshots = new Set(snapshots?.map(s => s.analysis_id) || []);
    const idsToDelete = analysisIds.filter(id => !idsWithSnapshots.has(id));
    
    if (idsToDelete.length > 0) {
      await supabase
        .from('spending_analyses')
        .delete()
        .in('id', idsToDelete);
    }
  }
}

export function clearLocalAnalysisCache(userId: string) {
  localStorage.removeItem(`last_analysis_${userId}`);
}

// Keys that should be preserved across logout (UI preferences only)
const PRESERVED_KEYS = [
  'theme',
  'language',
  'hide_outlink_modal',
  'dashboard_tour_completed'
];

export async function handleLogout(): Promise<void> {
  try {
    // Log the logout event first (while we still have user context)
    await logAuditEvent('USER_LOGOUT', { category: 'auth' });
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear localStorage except preserved keys
    const preserved: Record<string, string | null> = {};
    PRESERVED_KEYS.forEach(key => {
      preserved[key] = localStorage.getItem(key);
    });
    
    localStorage.clear();
    
    // Restore preserved keys
    Object.entries(preserved).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    });
    
    // Clear sessionStorage completely
    sessionStorage.clear();
    
    console.log('[SessionManager] Logout complete, sensitive data cleared');
  } catch (error) {
    console.error('[SessionManager] Error during logout:', error);
    throw error;
  }
}

// Clear specific user data on logout
export function clearUserDataFromStorage(): void {
  const keysToRemove = [
    'offline_queue',
    /^last_analysis_/,  // Matches all last_analysis_* keys
    /^analysis_cache_/,
    'user_preferences_cache',
    'recommendation_cache'
  ];
  
  // Remove matching keys
  Object.keys(localStorage).forEach(key => {
    const shouldRemove = keysToRemove.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(key);
      }
      return key === pattern;
    });
    
    if (shouldRemove) {
      localStorage.removeItem(key);
    }
  });
}

export async function getCurrentSessionState(userId: string) {
  // Get the most recent analysis
  const { data: latestAnalysis } = await supabase
    .from('spending_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (!latestAnalysis) {
    return { state: 'no_analysis', redirectTo: '/upload' };
  }
  
  // Check if there's a snapshot for this analysis
  const { data: snapshot } = await supabase
    .from('recommendation_snapshots')
    .select('id')
    .eq('analysis_id', latestAnalysis.id)
    .maybeSingle();
  
  if (snapshot) {
    return { 
      state: 'completed',
      redirectTo: '/dashboard',
      analysisId: latestAnalysis.id,
      snapshotId: snapshot.id
    };
  }
  
  // Check if analysis is recent
  const daysSince = (Date.now() - new Date(latestAnalysis.created_at).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSince < 7) {
    return {
      state: 'in_progress',
      redirectTo: `/results?analysisId=${latestAnalysis.id}`,
      analysisId: latestAnalysis.id
    };
  }
  
  return {
    state: 'stale_analysis',
    redirectTo: '/upload',
    analysisId: latestAnalysis.id
  };
}
