import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { waitForProfile, isOnboardingComplete } from "@/lib/authUtils";
import { trackOnboardingGateTriggered } from "@/lib/authAnalytics";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireOnboarding = false 
}: ProtectedRouteProps) => {
  const [checking, setChecking] = useState(true);
  const [showRetry, setShowRetry] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once on mount
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    let isMounted = true;
    
    const checkAccess = async () => {
      try {
        console.log('[ProtectedRoute] Checking access for:', location.pathname);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        // Not authenticated
        if (!session) {
          console.log('[ProtectedRoute] No session, redirecting to /auth');
          if (isMounted) setChecking(false);
          const returnTo = location.pathname + location.search;
          navigate(`/auth?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
          return;
        }
        
        console.log('[ProtectedRoute] Session found, checking profile...');
        
        // Wait for profile
        const profile = await waitForProfile(session.user.id);
        
        if (!profile) {
          console.log('[ProtectedRoute] Profile not found, signing out');
          if (isMounted) {
            toast.error('Profile not found. Please try logging in again.');
            setChecking(false);
          }
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
            
            if (isMounted) setChecking(false);
            const returnTo = location.pathname + location.search;
            navigate(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
            return;
          }
        }
        
        console.log('[ProtectedRoute] Access granted');
        if (isMounted) setChecking(false);
      } catch (error) {
        console.error('[ProtectedRoute] Error checking access:', error);
        if (isMounted) {
          toast.error('Error verifying access. Please try again.');
          setChecking(false);
        }
        navigate('/auth', { replace: true });
      }
    };

    // Set timeout to show retry button after 10 seconds
    const timeoutId = setTimeout(() => {
      if (checking) {
        setShowRetry(true);
      }
    }, 10000);

    checkAccess().finally(() => clearTimeout(timeoutId));
    
    return () => {
      isMounted = false;
    };
  }, [requireOnboarding]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
          {showRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Taking too long? Click to retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
