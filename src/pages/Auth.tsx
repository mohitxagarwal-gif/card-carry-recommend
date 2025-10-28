import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { afterAuthRedirect, getReturnToFromQuery } from "@/lib/authUtils";
import { trackAuthSuccess } from "@/lib/authAnalytics";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitingForProfile, setWaitingForProfile] = useState(false);

  // Handle OAuth callback and session check
  useEffect(() => {
    console.log('[Auth.tsx:33] OAuth callback handler started');
    
    // FIRST: Check if user already has an active session
    const checkExistingSession = async () => {
      try {
        console.log('[Auth.tsx:37] Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth.tsx:41] Error checking session:', error);
          return false;
        }
        
        if (session) {
          console.log('[Auth.tsx:46] User already has active session, redirecting...');
          console.log('[Auth.tsx:47] User ID:', session.user.id);
          setLoading(true);
          setWaitingForProfile(true);
          await afterAuthRedirect(session.user.id, getReturnToFromQuery(), navigate);
          return true;
        }
        
        console.log('[Auth.tsx:54] No existing session found');
        return false;
      } catch (error) {
        console.error('[Auth.tsx:57] Error in checkExistingSession:', error);
        return false;
      }
    };
    
    // Check if this is an OAuth callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAccessToken = hashParams.has('access_token');
    const hasError = hashParams.has('error');
    const isOAuthCallback = hasAccessToken || hasError;
    
    console.log('[Auth.tsx:67] Window hash:', window.location.hash);
    console.log('[Auth.tsx:68] Has access token:', hasAccessToken);
    console.log('[Auth.tsx:69] Has error:', hasError);
    console.log('[Auth.tsx:70] Is OAuth callback:', isOAuthCallback);
    
    // Handle OAuth errors
    if (hasError) {
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');
      const error = hashParams.get('error');
      
      console.error('[Auth.tsx:78] OAuth error detected:', {
        error,
        errorCode,
        errorDescription
      });
      
      // Clear the hash to prevent repeated error displays
      window.history.replaceState(null, '', window.location.pathname);
      
      // Show user-friendly error message
      if (errorDescription?.includes('Unable to exchange external code')) {
        toast.error('Google sign-in configuration error. Please contact support or use email/password sign-in.');
        console.error('[Auth.tsx:90] DIAGNOSIS: Invalid OAuth client credentials in Supabase. Check Google Client ID/Secret in Lovable Cloud backend settings.');
      } else {
        toast.error(`Sign-in failed: ${errorDescription || error || 'Unknown error'}`);
      }
      
      return;
    }
    
    // If this is an OAuth callback, handle it
    if (isOAuthCallback) {
      console.log('[Auth.tsx:100] OAuth callback detected! Processing...');
      setLoading(true);
      setWaitingForProfile(true);
      
      // Immediately check for session after OAuth callback
      const handleOAuthCallback = async () => {
        console.log('[Auth.tsx:106] Checking session after OAuth callback...');
        
        // Wait a moment for Supabase to process the tokens
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth.tsx:113] Error getting session after OAuth:', error);
          toast.error('Error completing sign-in. Please try again.');
          setLoading(false);
          setWaitingForProfile(false);
          return;
        }
        
        if (session) {
          console.log('[Auth.tsx:121] Session found after OAuth callback');
          console.log('[Auth.tsx:122] User ID:', session.user.id);
          console.log('[Auth.tsx:123] User email:', session.user.email);
          
          try {
            console.log('[Auth.tsx:126] Tracking auth success for Google');
            trackAuthSuccess('google');
            
            console.log('[Auth.tsx:129] Calling afterAuthRedirect with userId:', session.user.id);
            await afterAuthRedirect(session.user.id, getReturnToFromQuery(), navigate);
            console.log('[Auth.tsx:131] afterAuthRedirect completed successfully');
          } catch (error) {
            console.error('[Auth.tsx:133] Error during OAuth redirect:', error);
            console.error('[Auth.tsx:134] Error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
            toast.error('Error completing sign-in. Please try again.');
            setLoading(false);
            setWaitingForProfile(false);
          }
        } else {
          console.error('[Auth.tsx:143] No session found after OAuth callback');
          toast.error('Failed to complete sign-in. Please try again.');
          setLoading(false);
          setWaitingForProfile(false);
        }
      };
      
      handleOAuthCallback();
      
      // Also set up listener as backup
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth.tsx:154] Auth state changed:', event);
        console.log('[Auth.tsx:155] Session:', session ? 'Session exists' : 'No session');
        
        if (event === 'SIGNED_IN' && session) {
          console.log('[Auth.tsx:158] User signed in via OAuth (backup listener)');
          console.log('[Auth.tsx:159] User ID:', session.user.id);
          console.log('[Auth.tsx:160] User email:', session.user.email);
          
          try {
            console.log('[Auth.tsx:163] Tracking auth success for Google');
            trackAuthSuccess('google');
            
            console.log('[Auth.tsx:166] Calling afterAuthRedirect with userId:', session.user.id);
            await afterAuthRedirect(session.user.id, getReturnToFromQuery(), navigate);
            console.log('[Auth.tsx:168] afterAuthRedirect completed successfully');
          } catch (error) {
            console.error('[Auth.tsx:170] Error during OAuth redirect:', error);
            console.error('[Auth.tsx:171] Error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
            toast.error('Error completing sign-in. Please try again.');
            setLoading(false);
            setWaitingForProfile(false);
          }
        }
      });
      
      // Cleanup subscription
      return () => {
        console.log('[Auth.tsx:184] Cleaning up auth state listener');
        subscription.unsubscribe();
      };
    }
    
    // If not an OAuth callback, just check for existing session
    if (!isOAuthCallback) {
      console.log('[Auth.tsx:191] Not an OAuth callback, checking for existing session');
      checkExistingSession();
    }
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    console.log('[Auth.tsx:197] handleGoogleSignIn called');
    try {
      setLoading(true);
      console.log('[Auth.tsx:200] Loading state set to true');
      
      const redirectUrl = `${window.location.origin}/auth`;
      console.log('[Auth.tsx:203] Redirect URL:', redirectUrl);
      console.log('[Auth.tsx:204] Window origin:', window.location.origin);
      
      console.log('[Auth.tsx:206] Calling supabase.auth.signInWithOAuth...');
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

      console.log('[Auth.tsx:217] signInWithOAuth response:', error ? 'Error' : 'Success');
      if (error) {
        console.error('[Auth.tsx:219] OAuth initiation error:', error);
        throw error;
      }
      console.log('[Auth.tsx:222] User should be redirecting to Google...');
    } catch (error: any) {
      console.error('[Auth.tsx:224] Error signing in with Google:', error);
      console.error('[Auth.tsx:225] Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      toast.error(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Validate signup inputs
      try {
        authSchema.parse({ email, password, fullName });
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error(error.errors[0].message);
          return;
        }
      }
    }

    setLoading(true);
    setWaitingForProfile(false);
    const returnTo = getReturnToFromQuery();

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        if (data.user) {
          toast.success("Account created! Setting up your profile...");
          setWaitingForProfile(true);
          
          trackAuthSuccess('email');
          
          try {
            await afterAuthRedirect(data.user.id, returnTo, navigate);
          } catch (error) {
            console.error('Error during post-signup redirect:', error);
            toast.error('Profile setup delayed. Redirecting to onboarding...');
            navigate('/onboarding/basics', { replace: true });
          }
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === "Invalid login credentials") {
            toast.error("Invalid email or password. Please try again.");
          } else {
            throw error;
          }
          return;
        }

        if (data.user) {
          setWaitingForProfile(true);
          trackAuthSuccess('email');
          
          try {
            await afterAuthRedirect(data.user.id, returnTo, navigate);
          } catch (error) {
            console.error('Error during post-signin redirect:', error);
            toast.error('Error loading profile. Please try again.');
          }
        }
      }
    } catch (error: any) {
      console.error('Error during authentication:', error);
      toast.error(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
      setWaitingForProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <CreditCard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold text-foreground">
              card & carry.
            </h1>
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
            {isSignUp ? "begin your journey" : "welcome back"}
          </h2>
          <p className="text-muted-foreground font-sans">
            {isSignUp
              ? "create an account to start analyzing your spending"
              : "sign in to continue your analysis"}
          </p>
        </div>

        <Card className="p-8 border-border">
          <Button
            type="button"
            variant="outline"
            className="w-full font-sans flex items-center justify-center gap-3 h-11 mb-6"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-sans">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-sans">full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="font-sans"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-sans">email</Label>
              <Input
                id="email"
                type="email"
                placeholder="enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-sans"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-sans">password</Label>
              <Input
                id="password"
                type="password"
                placeholder="enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-sans"
              />
            </div>

            <Button
              type="submit"
              className="w-full font-sans"
              disabled={loading}
            >
              {loading ? (
                waitingForProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    setting up your profile...
                  </>
                ) : (
                  "processing..."
                )
              ) : (
                isSignUp ? "create account" : "sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp
                ? "already have an account? sign in"
                : "don't have an account? sign up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;