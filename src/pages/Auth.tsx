import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { afterAuthRedirect, getReturnToFromQuery } from "@/lib/authUtils";
import { trackAuthSuccess } from "@/lib/authAnalytics";
import { logAuditEvent } from "@/lib/auditLog";
import { trackEvent } from "@/lib/analytics";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [waitingForProfile, setWaitingForProfile] = useState(false);

  // Handle OAuth callback and session check
  useEffect(() => {
    console.log('[Auth.tsx] Auth callback handler started');
    
    // Check hash parameters for tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAccessToken = hashParams.has('access_token');
    const hasError = hashParams.has('error');
    
    // FIRST: Check if user already has an active session
    const checkExistingSession = async () => {
      try {
        console.log('[Auth.tsx] Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth.tsx] Error checking session:', error);
          return false;
        }
        
        if (session) {
          console.log('[Auth.tsx] User already has active session, redirecting...');
          setLoading(true);
          setWaitingForProfile(true);
          await afterAuthRedirect(session.user.id, getReturnToFromQuery(), navigate);
          return true;
        }
        
        console.log('[Auth.tsx] No existing session found');
        return false;
      } catch (error) {
        console.error('[Auth.tsx] Error in checkExistingSession:', error);
        return false;
      }
    };
    
    const isOAuthCallback = hasAccessToken || hasError;
    
    console.log('[Auth.tsx] Window hash:', window.location.hash);
    console.log('[Auth.tsx] Has access token:', hasAccessToken);
    console.log('[Auth.tsx] Has error:', hasError);
    console.log('[Auth.tsx] Is OAuth callback:', isOAuthCallback);
    
    // Handle OAuth errors
    if (hasError) {
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');
      const error = hashParams.get('error');
      
      console.error('[Auth.tsx] OAuth error detected:', {
        error,
        errorCode,
        errorDescription
      });
      
      window.history.replaceState(null, '', window.location.pathname);
      
      if (errorDescription?.includes('Unable to exchange external code') || 
          errorDescription?.includes('invalid_client') ||
          error === 'server_error') {
        toast.error(
          'Google sign-in is currently unavailable. Please try again later.',
          { duration: 6000 }
        );
        console.error('[Auth.tsx] CRITICAL: Google OAuth credentials not configured or invalid in backend');
      } else {
        toast.error(`Sign-in failed: ${errorDescription || error || 'Unknown error'}`);
      }
      
      setLoading(false);
      return;
    }
    
    // If this is an OAuth callback, handle it
    if (isOAuthCallback) {
      console.log('[Auth.tsx] OAuth callback detected! Processing...');
      setLoading(true);
      setWaitingForProfile(true);
      
      const handleOAuthCallback = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('[Auth.tsx] Error getting session after OAuth:', error);
          toast.error('Error completing sign-in. Please try again.');
          setLoading(false);
          setWaitingForProfile(false);
          return;
        }
        
        console.log('[Auth.tsx] Session found after OAuth callback');
        trackAuthSuccess('google');
        
        // Mixpanel event
        trackEvent('auth.login_success', {
          provider: 'google',
          returnTo: getReturnToFromQuery() || 'default',
        });
        
        // Log OAuth success in audit trail
        await logAuditEvent('AUTH_SIGNIN_SUCCESS', {
          category: 'auth',
          metadata: { provider: 'google', method: 'oauth' }
        });
        
        try {
          await afterAuthRedirect(session.user.id, getReturnToFromQuery(), navigate);
        } catch (error) {
          console.error('[Auth.tsx] Error during OAuth redirect:', error);
          toast.error('Error completing sign-in. Please try again.');
          setLoading(false);
          setWaitingForProfile(false);
        }
      };
      
      handleOAuthCallback();
      return;
    }
    
    // If not an OAuth callback, just check for existing session
    if (!isOAuthCallback) {
      checkExistingSession();
    }
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('[Auth.tsx] Error signing in with Google:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Header with logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <CreditCard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold text-foreground">
              card & carry.
            </h1>
          </div>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
            get started
          </h2>
          <p className="text-muted-foreground font-sans">
            sign in with google to start analyzing your spending
          </p>
        </div>

        {/* Google Sign-In Card */}
        <Card className="p-8 border-border">
          <Button 
            onClick={handleGoogleSignIn} 
            disabled={loading}
            className="w-full h-12 text-base font-sans"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {waitingForProfile ? "setting up your profile..." : "redirecting to google..."}
              </>
            ) : (
              <>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-4 font-sans">
            quick, secure sign-in with your google account
          </p>
        </Card>

        {/* Info footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground font-sans">
            by signing in, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
