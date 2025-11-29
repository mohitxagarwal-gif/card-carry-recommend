import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Calculator, Target, ArrowRight, Loader2 } from "lucide-react";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";

export default function OnboardingStart() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setChecking(false);
    };

    checkProfile();
    trackEvent("onboarding.start_viewed");
  }, [navigate]);

  const handlePathSelect = (path: 'upload' | 'quick-spends' | 'goal-based') => {
    trackEvent("onboarding.path_selected", { path });
    
    if (path === 'upload') {
      navigate('/onboarding/profile');
    } else if (path === 'quick-spends') {
      navigate('/onboarding/quick-spends');
    } else {
      navigate('/onboarding/goal-based');
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading font-bold">
              how would you like to get started?
            </h1>
            <p className="text-lg text-muted-foreground">
              choose the path that works best for you
            </p>
          </div>

          {/* Path Options */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Upload Statements */}
            <Card className="p-6 hover:border-primary transition-colors cursor-pointer group">
              <button 
                onClick={() => handlePathSelect('upload')}
                className="w-full text-left space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Upload Statements</h3>
                  <p className="text-sm text-muted-foreground">
                    Most accurate. Upload your bank/card statements for personalized recommendations based on your actual spending.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Most Accurate
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    5 min
                  </span>
                </div>
              </button>
            </Card>

            {/* Quick Manual Input */}
            <Card className="p-6 hover:border-primary transition-colors cursor-pointer group">
              <button 
                onClick={() => handlePathSelect('quick-spends')}
                className="w-full text-left space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Calculator className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Quick Estimate</h3>
                  <p className="text-sm text-muted-foreground">
                    Fastest way. Manually enter your estimated monthly spending and category breakdown for quick recommendations.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Fastest
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    2 min
                  </span>
                </div>
              </button>
            </Card>

            {/* Goal-Based */}
            <Card className="p-6 hover:border-primary transition-colors cursor-pointer group">
              <button 
                onClick={() => handlePathSelect('goal-based')}
                className="w-full text-left space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Choose a Goal</h3>
                  <p className="text-sm text-muted-foreground">
                    Goal-focused. Select from preset financial goals (travel rewards, cashback, etc.) to get targeted card suggestions.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Goal-Focused
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    1 min
                  </span>
                </div>
              </button>
            </Card>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-muted-foreground">
            Don't worry, you can always upload statements later for more accurate recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
