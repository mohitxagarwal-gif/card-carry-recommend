import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { useShortlist } from "@/hooks/useShortlist";
import { useApplications } from "@/hooks/useApplications";
import { useUserCards } from "@/hooks/useUserCards";
import { useDeriveFeatures } from "@/hooks/useDeriveFeatures";
import { TrendingUp, Heart, FileText, Upload, AlertCircle, CreditCard as CreditCardIcon, Plus, RefreshCw, Sparkles } from "lucide-react";
import { CardLoadingScreen } from "@/components/CardLoadingScreen";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { trackEvent as trackMixpanelEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { MyCardsModule } from "@/components/dashboard/MyCardsModule";
import { FeeWaiverGoalsModule } from "@/components/dashboard/FeeWaiverGoalsModule";
import { RemindersModule } from "@/components/dashboard/RemindersModule";
import { ContentFeedCarousel } from "@/components/dashboard/ContentFeedCarousel";
import { RecommendedCardsModule } from "@/components/dashboard/RecommendedCardsModule";
import { AddCardDialog } from "@/components/dashboard/AddCardDialog";
import { ShortlistCardsDisplay } from "@/components/dashboard/ShortlistCardsDisplay";
import { generateNextSteps } from "@/lib/nextStepsGenerator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardTourModal } from "@/components/dashboard/DashboardTourModal";
import { Progress } from "@/components/ui/progress";
import { EligibilityCenter } from "@/components/dashboard/EligibilityCenter";

const Dashboard = () => {
  const navigate = useNavigate();
  const { latestSnapshot, isLoading: snapshotLoading, createSnapshot } = useRecommendationSnapshot();
  const { shortlist, isLoading: shortlistLoading } = useShortlist();
  const { applications, isLoading: appsLoading } = useApplications();
  const { userCards, isLoading: cardsLoading, getActiveCards } = useUserCards();
  const deriveFeatures = useDeriveFeatures();
  const [incompleteAnalysis, setIncompleteAnalysis] = useState<any>(null);
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const tourChecked = useRef(false);

  useEffect(() => {
    console.log('[Dashboard] Component mounted');
    console.log('[Dashboard] Loading states:', {
      snapshotLoading,
      shortlistLoading,
      appsLoading,
      cardsLoading
    });
    
    trackEvent("dash_view");
    loadProfileData();
  }, []);
  
  // Track dashboard view with aggregate stats when all data loads
  useEffect(() => {
    if (!snapshotLoading && !shortlistLoading && !appsLoading && !cardsLoading) {
      const activeCards = getActiveCards();
      
      trackMixpanelEvent('dashboard.viewed', {
        shortlistSize: shortlist.length,
        applicationsCount: applications.length,
        ownedCardsCount: activeCards.length,
        hasRecentAnalysis: !!latestSnapshot,
      });
    }
  }, [snapshotLoading, shortlistLoading, appsLoading, cardsLoading, shortlist, applications, userCards, latestSnapshot]);

  // Check tour after all data loads (only once)
  useEffect(() => {
    if (!snapshotLoading && !shortlistLoading && !appsLoading && !cardsLoading && !tourChecked.current) {
      tourChecked.current = true;
      
      const hasData = latestSnapshot || shortlist.length > 0 || applications.length > 0;
      const tourCompleted = localStorage.getItem("dashboard_tour_completed");
      
      if (!tourCompleted && latestSnapshot && hasData) {
        setShowTour(true);
      }
    }
  }, [snapshotLoading, shortlistLoading, appsLoading, cardsLoading, latestSnapshot, shortlist, applications]);

  // Error timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (snapshotLoading || shortlistLoading || appsLoading || cardsLoading) {
        setError('Dashboard is taking longer than expected to load. Please refresh the page.');
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [snapshotLoading, shortlistLoading, appsLoading, cardsLoading]);

  const loadProfileData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: prefsData } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setProfile(profileData);
    setPreferences(prefsData);
  };

  useEffect(() => {
    const checkIncompleteAnalysis = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: latestAnalysis } = await supabase
        .from('spending_analyses')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (latestAnalysis && (!latestSnapshot || 
          new Date(latestAnalysis.created_at) > new Date(latestSnapshot.created_at))) {
        setIncompleteAnalysis(latestAnalysis);
      }
    };
    
    checkIncompleteAnalysis();
  }, [latestSnapshot]);

  const handleRefreshRecommendations = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to refresh recommendations");
        return;
      }

      // Get latest analysis (may be null for manual onboarding flows)
      const { data: latestAnalysis } = await supabase
        .from('spending_analyses')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check if we have user features (required for manual flows)
      const { data: userFeatures } = await supabase
        .from('user_features')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!latestAnalysis && !userFeatures) {
        toast.error("No data found. Please upload statements or complete onboarding first.");
        return;
      }

      // Step 1: Derive/update features
      if (latestAnalysis) {
        await deriveFeatures.mutateAsync({
          userId: user.id,
          analysisId: latestAnalysis.id,
        });
      }

      // Step 2: Generate new recommendations (works with or without analysisId)
      const { data: recData, error: recError } = await supabase.functions.invoke("generate-recommendations", {
        body: { 
          analysisId: latestAnalysis?.id || null,
        },
      });

      if (recError) throw recError;

      // Step 3: Create new snapshot
      if (recData?.recommendations) {
        createSnapshot({
          analysisId: latestAnalysis?.id || null,
          savingsMin: recData.savingsMin || 0,
          savingsMax: recData.savingsMax || 0,
          confidence: recData.confidence || 'medium',
          recommendedCards: recData.recommendations,
        });
      }

      toast.success("Recommendations refreshed successfully!");
      trackEvent("recommendations_refresh", { 
        source: "dashboard",
        hasAnalysis: !!latestAnalysis
      });
      window.location.reload(); // Reload to show updated data
    } catch (error: any) {
      console.error("Refresh error:", error);
      toast.error("Failed to refresh recommendations");
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-foreground font-semibold">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (snapshotLoading || shortlistLoading || appsLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <CardLoadingScreen
          message="Preparing your dashboard..."
          variant="inline"
        />
      </div>
    );
  }

  const hasData = latestSnapshot || shortlist.length > 0 || applications.length > 0;

  // Calculate profile completeness
  const calculateProfileStrength = () => {
    let score = 0;
    const fields = [
      profile?.age_range,
      profile?.income_band_inr,
      profile?.city,
      preferences?.fee_sensitivity,
      preferences?.travel_frequency,
      preferences?.lounge_importance,
      preferences?.reward_preference,
    ];
    
    fields.forEach(field => {
      if (field) score += 100 / fields.length;
    });
    
    return Math.round(score);
  };

  const profileStrength = profile ? calculateProfileStrength() : 0;
  const showProfileStrength = profileStrength < 80;

  const getMissingProfileFields = () => {
    const missing = [];
    if (!profile?.city) missing.push("City");
    if (!preferences?.fee_sensitivity) missing.push("Fee Preference");
    if (!preferences?.travel_frequency) missing.push("Travel Habits");
    if (!preferences?.lounge_importance) missing.push("Lounge Importance");
    return missing;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-8">
          your dashboard
        </h1>

        {!hasData ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">get started</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                upload your bank or credit card statements to see personalized recommendations and track your progress.
              </p>
              <Button onClick={() => navigate("/upload")}>
                upload statements
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Eligibility Center */}
            <EligibilityCenter />

            {/* Incomplete Analysis Alert */}
            {incompleteAnalysis && (
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    incomplete analysis found
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You have an analysis from {new Date(incompleteAnalysis.created_at).toLocaleDateString()} 
                    {' '}that hasn't been completed yet. Continue to review transactions and generate recommendations.
                  </p>
                  <Button 
                    onClick={() => navigate(`/results?analysisId=${incompleteAnalysis.id}`)}
                  >
                    Continue Analysis
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card data-tour-id="next-steps-module">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  next steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {generateNextSteps(latestSnapshot, applications, shortlist, userCards, navigate).map((step) => (
                  <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span>{step.text}</span>
                    <Button size="sm" onClick={step.action}>
                      {step.cta}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Savings Summary */}
            {latestSnapshot && (
              <Card data-tour-id="recommendations-module">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      estimated annual savings
            {(latestSnapshot as any).snapshot_type && (latestSnapshot as any).snapshot_type !== 'statement_based' && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                ({(latestSnapshot as any).snapshot_type === 'quick_spends' ? 'based on estimates' : 'goal-optimized'})
              </span>
            )}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshRecommendations}
                      disabled={refreshing}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-3xl font-heading font-bold text-primary tabular-nums">
                      ₹{latestSnapshot.savings_min.toLocaleString()} - ₹{latestSnapshot.savings_max.toLocaleString()}
                    </p>
                    <Badge variant="outline" className={
                      latestSnapshot.confidence === 'high' 
                        ? 'bg-green-500/10 text-green-700 border-green-500/20'
                        : latestSnapshot.confidence === 'medium'
                        ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                        : 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
                    }>
                      {latestSnapshot.confidence} confidence
                    </Badge>
                    {(latestSnapshot as any).snapshot_type !== 'statement_based' && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        Upload statements for more accurate recommendations
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => {
                        navigate('/recs');
                        trackEvent('dash_view_recs');
                      }}
                    >
                      View Recommendations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommended Cards (replaces Applications) */}
            <RecommendedCardsModule />

            {/* Shortlist */}
            {shortlist.length > 0 && (
              <Card data-tour-id="shortlist-module">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    shortlist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ShortlistCardsDisplay 
                    shortlistIds={shortlist.map(s => s.card_id)} 
                    navigate={navigate}
                  />
                </CardContent>
              </Card>
            )}

            {/* Card Management Modules - Only show if user has cards */}
            {getActiveCards().length > 0 ? (
              <div data-tour-id="my-cards-module">
                <MyCardsModule />
                <FeeWaiverGoalsModule />
                <RemindersModule />
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <CreditCardIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="text-xl font-semibold">manage your cards</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    add your existing credit cards to track fee waivers, lounge access, and set reminders
                  </p>
                  <Button onClick={() => setAddCardDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    add your first card
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Content Feed Carousel */}
            <ContentFeedCarousel />

            {/* Data Freshness */}
            {latestSnapshot && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Last analysis</p>
                      <p className="font-medium">
                        {new Date(latestSnapshot.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <Button onClick={() => navigate('/upload')}>
                      Re-analyze
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Add Card Dialog */}
      <AddCardDialog open={addCardDialogOpen} onOpenChange={setAddCardDialogOpen} />
      
      {/* Dashboard Tour */}
      <DashboardTourModal open={showTour} onOpenChange={setShowTour} />
    </div>
  );
};

export default Dashboard;
