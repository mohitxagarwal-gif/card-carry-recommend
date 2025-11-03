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
  const [passwordResetMode, setPasswordResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  // Handle OAuth callback, email confirmation, password reset, and session check
  useEffect(() => {
    console.log('[Auth.tsx] Auth callback handler started');
    
    // Check URL parameters for mode
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    const confirmed = searchParams.get('confirmed');
    
    // Check hash parameters for tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAccessToken = hashParams.has('access_token');
    const hasError = hashParams.has('error');
    const tokenType = hashParams.get('type');
    
    // Check if this is a password reset callback
    if (mode === 'reset' && hasAccessToken) {
      console.log('[Auth.tsx] Password reset callback detected');
      setPasswordResetMode(true);
      setLoading(false);
      return;
    }
    
    // Check if this is an email confirmation callback
    if ((confirmed === 'true' || tokenType === 'signup') && hasAccessToken) {
      console.log('[Auth.tsx] Email confirmation callback detected');
      setLoading(true);
      setWaitingForProfile(true);
      
      const handleEmailConfirmation = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('[Auth.tsx] Error getting session after confirmation:', error);
          toast.error('Error completing verification. Please try signing in.');
          setLoading(false);
          setWaitingForProfile(false);
          return;
        }
        
        toast.success('Email verified successfully!');
        trackAuthSuccess('email');
        
        try {
          await afterAuthRedirect(session.user.id, getReturnToFromQuery(), navigate);
        } catch (error) {
          console.error('[Auth.tsx] Error during post-confirmation redirect:', error);
          toast.error('Error loading profile. Redirecting...');
          navigate('/onboarding/basics', { replace: true });
        }
      };
      
      handleEmailConfirmation();
      return;
    }
    
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
          'Google sign-in is currently unavailable. Please use email/password to sign in.',
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

  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: confirmationEmail,
      });
      
      if (error) throw error;
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('[Auth.tsx] Error resending confirmation:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) throw error;
      
      toast.success('Password reset email sent! Please check your inbox.');
      setPasswordResetMode(false);
      setEmail('');
    } catch (error: any) {
      console.error('[Auth.tsx] Error requesting password reset:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully! You can now sign in.');
      setPasswordResetMode(false);
      setNewPassword('');
      setConfirmPassword('');
      window.history.replaceState(null, '', window.location.pathname);
    } catch (error: any) {
      console.error('[Auth.tsx] Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
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
            emailRedirectTo: `${window.location.origin}/auth?confirmed=true`,
          },
        });

        if (error) throw error;

        if (data.user) {
          // Check if email confirmation is required
          if (!data.session) {
            // Email confirmation required
            setAwaitingConfirmation(true);
            setConfirmationEmail(email);
            toast.success('Account created! Please check your email to verify your account.');
            return;
          }
          
          // Auto-confirmed, proceed with redirect
          toast.success("Account created! Setting up your profile...");
          setWaitingForProfile(true);
          trackAuthSuccess('email');
          
          try {
            await afterAuthRedirect(data.user.id, returnTo, navigate);
          } catch (error) {
            console.error('[Auth.tsx] Error during post-signup redirect:', error);
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

  // Show email confirmation waiting screen
  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <CreditCard className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-heading font-bold text-foreground">
                card & carry.
              </h1>
            </div>
          </div>
          
          <Card className="p-8 border-border">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-heading font-bold text-foreground">
                verify your email
              </h2>
              
              <p className="text-muted-foreground font-sans">
                We've sent a verification link to:
              </p>
              
              <p className="text-foreground font-sans font-medium">
                {confirmationEmail}
              </p>
              
              <p className="text-sm text-muted-foreground font-sans">
                Click the link in the email to verify your account. Don't forget to check your spam folder!
              </p>
              
              <div className="pt-4">
                <Button
                  onClick={handleResendConfirmation}
                  variant="outline"
                  className="w-full font-sans"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      sending...
                    </>
                  ) : (
                    'resend verification email'
                  )}
                </Button>
              </div>
              
              <button
                onClick={() => {
                  setAwaitingConfirmation(false);
                  setConfirmationEmail('');
                }}
                className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                back to sign in
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show password reset form
  if (passwordResetMode) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hasToken = hashParams.has('access_token');
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <CreditCard className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-heading font-bold text-foreground">
                card & carry.
              </h1>
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
              {hasToken ? 'set new password' : 'reset password'}
            </h2>
            <p className="text-muted-foreground font-sans">
              {hasToken 
                ? 'enter your new password below'
                : 'enter your email to receive a password reset link'}
            </p>
          </div>
          
          <Card className="p-8 border-border">
            {hasToken ? (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="font-sans">new password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="font-sans"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="font-sans">confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      updating password...
                    </>
                  ) : (
                    'update password'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordResetRequest} className="space-y-6">
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
                
                <Button
                  type="submit"
                  className="w-full font-sans"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      sending...
                    </>
                  ) : (
                    'send reset link'
                  )}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setPasswordResetMode(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setEmail('');
                  window.history.replaceState(null, '', window.location.pathname);
                }}
                className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                back to sign in
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-sans">password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setPasswordResetMode(true)}
                    className="text-xs font-sans text-primary hover:text-primary/80 transition-colors"
                  >
                    forgot password?
                  </button>
                )}
              </div>
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