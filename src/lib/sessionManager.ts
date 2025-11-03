import { supabase } from "@/integrations/supabase/client";

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
