import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isOnboardingComplete } from "@/lib/authUtils";
import { trackOnboardingGateTriggered } from "@/lib/authAnalytics";
import { CardLoadingScreen } from "@/components/CardLoadingScreen";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireOnboarding = false 
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: authData, isLoading } = useAuthSession();

  useEffect(() => {
    if (isLoading) return;

    const { isAuthenticated, profile } = authData || {};

    // Not authenticated
    if (!isAuthenticated) {
      // Check for saved progress using proper pattern matching
      const hasSavedProgress = Object.keys(localStorage).some(key => 
        key.startsWith('smartscan_progress_') ||
        key.startsWith('goalpick_progress_') ||
        key.startsWith('generating_recommendations_') ||
        key === 'quickSpends_draft'
      );
      
      // If user has progress, give auth state a grace period (500ms) to resolve
      if (hasSavedProgress) {
        console.log('[ProtectedRoute] Progress detected, allowing auth to resolve...');
        
        // Only wait on first mount, not on every re-render
        const waitKey = `protectedroute_wait_${location.pathname}`;
        const hasWaited = sessionStorage.getItem(waitKey);
        
        if (!hasWaited) {
          sessionStorage.setItem(waitKey, 'true');
          setTimeout(() => {
            // Re-check auth after grace period
            const recheckAuth = async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                const returnTo = location.pathname + location.search;
                navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
              }
            };
            recheckAuth();
          }, 500);
          return;
        }
      }
      
      const returnTo = location.pathname + location.search;
      navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }

    // Check onboarding if required
    if (requireOnboarding && profile) {
      const isComplete = isOnboardingComplete(profile);

      if (!isComplete) {
        const missingFields: string[] = [];
        if (!profile.age_range) missingFields.push('age_range');
        if (!profile.income_band_inr) missingFields.push('income_band_inr');

        trackOnboardingGateTriggered(missingFields);

        const returnTo = location.pathname + location.search;
        navigate(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
      }
    }
  }, [isLoading, authData, requireOnboarding, location.pathname, location.search, navigate]);

  if (isLoading) {
    return (
      <CardLoadingScreen
        message="Getting things ready..."
        variant="fullPage"
      />
    );
  }

  return <>{children}</>;
};
