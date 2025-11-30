import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isOnboardingComplete } from "@/lib/authUtils";
import { trackOnboardingGateTriggered } from "@/lib/authAnalytics";
import { CardLoadingScreen } from "@/components/CardLoadingScreen";
import { useAuthSession } from "@/hooks/useAuthSession";

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
      // Check for saved progress to give auth state time to load
      const hasSavedProgress = 
        localStorage.getItem('smartscan_progress_') ||
        localStorage.getItem('goalpick_progress_') ||
        localStorage.getItem('quickSpends_draft');
      
      // If user has progress, they might have just refreshed
      // Give the auth state a moment to resolve before redirecting
      if (hasSavedProgress) {
        console.log('[ProtectedRoute] Progress detected, allowing auth to resolve...');
        return;
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
