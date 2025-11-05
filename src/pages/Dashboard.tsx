import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { useShortlist } from "@/hooks/useShortlist";
import { useApplications } from "@/hooks/useApplications";
import { useUserCards } from "@/hooks/useUserCards";
import { Loader2, TrendingUp, Heart, FileText, Upload, AlertCircle, CreditCard as CreditCardIcon, Plus } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { latestSnapshot, isLoading: snapshotLoading } = useRecommendationSnapshot();
  const { shortlist, isLoading: shortlistLoading } = useShortlist();
  const { applications, isLoading: appsLoading } = useApplications();
  const { userCards, isLoading: cardsLoading, getActiveCards } = useUserCards();
  const [incompleteAnalysis, setIncompleteAnalysis] = useState<any>(null);
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);

  useEffect(() => {
    trackEvent("dash_view");
  }, []);

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

  if (snapshotLoading || shortlistLoading || appsLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const hasData = latestSnapshot || shortlist.length > 0 || applications.length > 0;

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
            <Card>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    estimated annual savings
                  </CardTitle>
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
              <Card>
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
              <>
                <MyCardsModule />
                <FeeWaiverGoalsModule />
                <RemindersModule />
              </>
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
    </div>
  );
};

export default Dashboard;
