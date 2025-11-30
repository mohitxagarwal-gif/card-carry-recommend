import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, PartyPopper, LayoutDashboard, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import { RecommendationsHero } from "@/components/recommendations/RecommendationsHero";
import { SpendingInsightsPanel } from "@/components/recommendations/SpendingInsightsPanel";
import { RecommendationsGrid } from "@/components/recommendations/RecommendationsGrid";
import { PersonalizationControls } from "@/components/recommendations/PersonalizationControls";
import { ActionBar } from "@/components/recommendations/ActionBar";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { trackEvent as trackMixpanelEvent } from "@/lib/analytics";

interface UserProfile {
  age_range?: string;
  income_band_inr?: string;
  city?: string;
}

interface UserPreferences {
  fee_sensitivity?: string;
  travel_frequency?: string;
  lounge_importance?: string;
  reward_preference?: string;
}

const Recommendations = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { latestSnapshot, isLoading: snapshotLoading } = useRecommendationSnapshot();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userFeatures, setUserFeatures] = useState<any>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [filterIssuer, setFilterIssuer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'savings' | 'fee'>('match');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Check if coming from onboarding
        const fromOnboarding = searchParams.get('from') === 'onboarding';
        if (fromOnboarding) {
          setShowSuccessBanner(true);
          // Auto-hide banner after 10 seconds
          setTimeout(() => setShowSuccessBanner(false), 10000);
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('age_range, income_band_inr, city')
          .eq('id', user.id)
          .maybeSingle();

        // Fetch user preferences
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('fee_sensitivity, travel_frequency, lounge_importance, reward_preference')
          .eq('user_id', user.id)
          .maybeSingle();

        // Fetch user features (for manual flows)
        const { data: features } = await supabase
          .from('user_features')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setUserProfile(profile);
        setUserPreferences(prefs);
        setUserFeatures(features);

        // If we have a snapshot, fetch the associated analysis
        if (latestSnapshot?.analysis_id) {
          const { data: analysis } = await supabase
            .from('spending_analyses')
            .select('analysis_data')
            .eq('id', latestSnapshot.analysis_id)
            .maybeSingle();

          if (analysis) {
            setAnalysisData(analysis.analysis_data);
          }
        }

        trackEvent("recommendations_page_view", {
          hasSnapshot: !!latestSnapshot,
          hasAnalysis: !!analysisData,
          fromOnboarding
        });
        
        // Mixpanel event
        trackMixpanelEvent('recommendation.page_viewed', {
          recommendationCount: latestSnapshot?.recommended_cards?.length || 0,
        });
      } catch (error) {
        console.error('Error loading recommendations:', error);
        toast.error('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    if (!snapshotLoading) {
      loadData();
    }
  }, [navigate, latestSnapshot, snapshotLoading, searchParams]);


  const handleRefresh = () => {
    trackEvent("recommendations_refresh_click");
    navigate("/upload");
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      if (prev.length >= 3) {
        toast.error("You can compare up to 3 cards at a time");
        return prev;
      }
      return [...prev, cardId];
    });
  };

  const handleClearSelection = () => {
    setSelectedCards([]);
  };

  if (loading || snapshotLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-sans">Loading your recommendations...</p>
        </div>
      </div>
    );
  }

  // No recommendations state
  if (!latestSnapshot) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-6 lg:px-12 py-16">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-foreground">
              No Recommendations Yet
            </h2>
            <p className="text-lg text-muted-foreground font-sans">
              Upload your credit card statements to get personalized card recommendations based on your spending patterns.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/upload")}
              className="mt-6"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Statements
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const recommendedCards = (latestSnapshot.recommended_cards as any[]) || [];
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(latestSnapshot.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isStale = daysSinceCreated > 30;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 lg:px-12 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Success Banner for Post-Onboarding */}
          {showSuccessBanner && (
            <Alert className="border-primary bg-primary/5">
              <PartyPopper className="h-5 w-5 text-primary" />
              <AlertDescription className="ml-2">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">
                      🎉 Your personalized recommendations are ready!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We've analyzed your spending and found the best cards for you. Explore them below or save them to your dashboard.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => {
                        navigate('/dashboard');
                        trackEvent('onboarding_success_dashboard_click');
                      }}
                      variant="default"
                      size="sm"
                      className="gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                    </Button>
                    <Button
                      onClick={() => setShowSuccessBanner(false)}
                      variant="ghost"
                      size="sm"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Hero Section */}
          <RecommendationsHero
            snapshot={latestSnapshot}
            daysSinceCreated={daysSinceCreated}
            isStale={isStale}
            onRefresh={handleRefresh}
            userProfile={userProfile}
          />

          {/* Insights + Personalization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SpendingInsightsPanel
                analysisData={analysisData}
                snapshot={latestSnapshot}
                userFeatures={userFeatures}
              />
            </div>
            <div>
              <PersonalizationControls
                userPreferences={userPreferences}
                onPreferenceChange={(prefs) => {
                  toast.success("Preferences updated! Refresh to see new recommendations.");
                }}
                analysisId={latestSnapshot?.analysis_id}
              />
            </div>
          </div>

          {/* Action Bar for Comparison */}
          {selectedCards.length > 0 && (
            <ActionBar
              selectedCards={selectedCards}
              onClearSelection={handleClearSelection}
              onCompare={() => {
                trackEvent("recommendations_compare_click", {
                  cardCount: selectedCards.length
                });
                // Navigate to compare with selected cards
                navigate(`/cards?compare=${selectedCards.join(',')}`);
              }}
            />
          )}

          {/* Recommendations Grid */}
          <RecommendationsGrid
            recommendedCards={recommendedCards}
            selectedCards={selectedCards}
            onCardSelect={handleCardSelect}
            filterIssuer={filterIssuer}
            sortBy={sortBy}
            onFilterChange={setFilterIssuer}
            onSortChange={setSortBy}
          />
        </div>
      </main>
    </div>
  );
};

export default Recommendations;
