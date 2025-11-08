import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { waitForProfile, isOnboardingComplete } from "@/lib/authUtils";
import { trackOnboardingGateTriggered } from "@/lib/authAnalytics";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireOnboarding = false 
}: ProtectedRouteProps) => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        console.log('[ProtectedRoute] Checking access for:', location.pathname);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        // Not authenticated
        if (!session) {
          console.log('[ProtectedRoute] No session, redirecting to /auth');
          const returnTo = location.pathname + location.search;
          navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
          return;
        }
        
        console.log('[ProtectedRoute] Session found, checking profile...');
        
        // Wait for profile
        const profile = await waitForProfile(session.user.id);
        
        if (!profile) {
          console.log('[ProtectedRoute] Profile not found, signing out');
          toast.error('Profile not found. Please try logging in again.');
          await supabase.auth.signOut();
          navigate('/auth', { replace: true });
          return;
        }
        
        console.log('[ProtectedRoute] Profile found:', { hasAgeRange: !!profile.age_range, hasIncome: !!profile.income_band_inr });
        
        // Check onboarding if required
        if (requireOnboarding) {
          const isComplete = isOnboardingComplete(profile);
          
          console.log('[ProtectedRoute] Onboarding check:', {
            required: requireOnboarding,
            isComplete,
            hasAgeRange: !!profile.age_range,
            hasIncomeBand: !!profile.income_band_inr
          });
          
          if (!isComplete) {
            console.log('[ProtectedRoute] Onboarding incomplete, redirecting');
            const missingFields: string[] = [];
            if (!profile.age_range) missingFields.push('age_range');
            if (!profile.income_band_inr) missingFields.push('income_band_inr');
            
            trackOnboardingGateTriggered(missingFields);
            
            const returnTo = location.pathname + location.search;
            navigate(`/onboarding/basics?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
            return;
          }
        }
        
        console.log('[ProtectedRoute] Access granted');
        setChecking(false);
      } catch (error) {
        console.error('[ProtectedRoute] Error checking access:', error);
        toast.error('Error verifying access. Please try again.');
        navigate('/auth', { replace: true });
      }
    };

    checkAccess();
  }, [navigate, location, requireOnboarding]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
