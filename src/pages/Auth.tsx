import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/upload");
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate sign up fields
        const validationResult = authSchema.safeParse({ email, fullName, password });
        if (!validationResult.success) {
          toast.error(validationResult.error.errors[0].message);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/upload`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully! Redirecting...");
          navigate("/upload");
        }
      } else {
        // Sign in validation
        if (!email || !password) {
          toast.error("Please enter both email and password");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Signed in successfully!");
          navigate("/upload");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <CreditCard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-playfair italic font-medium text-foreground">
              card & carry.
            </h1>
          </div>
          <h2 className="text-2xl font-playfair italic text-foreground mb-3">
            {isSignUp ? "begin your journey" : "welcome back"}
          </h2>
          <p className="text-muted-foreground font-sans">
            {isSignUp
              ? "create an account to start analyzing your spending"
              : "sign in to continue your analysis"}
          </p>
        </div>

        <Card className="p-8 border-border">
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
              {loading ? "processing..." : isSignUp ? "create account" : "sign in"}
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
