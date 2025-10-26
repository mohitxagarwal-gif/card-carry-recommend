import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { useShortlist } from "@/hooks/useShortlist";
import { useApplications } from "@/hooks/useApplications";
import { useUserCards } from "@/hooks/useUserCards";
import { Loader2, TrendingUp, Heart, FileText, Upload } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { MyCardsModule } from "@/components/dashboard/MyCardsModule";
import { FeeWaiverGoalsModule } from "@/components/dashboard/FeeWaiverGoalsModule";
import { RemindersModule } from "@/components/dashboard/RemindersModule";
import { ContentFeedModule } from "@/components/dashboard/ContentFeedModule";
import { generateNextSteps } from "@/lib/nextStepsGenerator";

const Dashboard = () => {
  const navigate = useNavigate();
  const { latestSnapshot, isLoading: snapshotLoading } = useRecommendationSnapshot();
  const { shortlist, isLoading: shortlistLoading } = useShortlist();
  const { applications, isLoading: appsLoading } = useApplications();
  const { userCards, isLoading: cardsLoading } = useUserCards();

  useEffect(() => {
    trackEvent("dash_view");
  }, []);

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
                      onClick={() => navigate('/recs')}
                    >
                      View Recommendations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shortlist & Applications */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Shortlist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shortlist.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Save cards you like from your recommendations
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-2xl font-semibold">{shortlist.length}</p>
                      <p className="text-sm text-muted-foreground">cards saved</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/recs')}
                      >
                        View All
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Track your card applications here
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Badge variant="outline">{applications.filter(a => a.status === 'considering').length} considering</Badge>
                        <Badge variant="outline">{applications.filter(a => a.status === 'applied').length} applied</Badge>
                        <Badge variant="outline">{applications.filter(a => a.status === 'approved').length} approved</Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/apps')}
                      >
                        Manage
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* My Cards */}
            <MyCardsModule />

            {/* Fee Waiver Goals */}
            <FeeWaiverGoalsModule />

            {/* Reminders */}
            <RemindersModule />

            {/* Content Feed */}
            <ContentFeedModule />

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
    </div>
  );
};

export default Dashboard;
