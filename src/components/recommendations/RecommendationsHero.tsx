import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, RefreshCw, AlertCircle, CheckCircle2, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RecommendationsHeroProps {
  snapshot: any;
  daysSinceCreated: number;
  isStale: boolean;
  onRefresh: () => void;
  userProfile: any;
}

export const RecommendationsHero = ({
  snapshot,
  daysSinceCreated,
  isStale,
  onRefresh,
  userProfile
}: RecommendationsHeroProps) => {
  const savingsMin = snapshot.savings_min || 0;
  const savingsMax = snapshot.savings_max || 0;
  const confidence = snapshot.confidence || 'medium';
  
  const confidenceColors = {
    high: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    low: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
  };

  const confidenceIcons = {
    high: CheckCircle2,
    medium: TrendingUp,
    low: AlertCircle
  };

  const ConfidenceIcon = confidenceIcons[confidence as keyof typeof confidenceIcons];

  const profileCompleteness = calculateProfileCompleteness(userProfile);

  return (
    <div className="space-y-4">
      {isStale && (
        <Alert className="border-orange-500/20 bg-orange-500/5">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 dark:text-orange-400">
            Your recommendations are {daysSinceCreated} days old. Upload recent statements for more accurate suggestions.
          </AlertDescription>
        </Alert>
      )}

      {profileCompleteness < 70 && (
        <Alert className="border-primary/20 bg-primary/5">
          <User className="h-4 w-4 text-primary" />
          <AlertDescription>
            <span className="font-medium">Complete your profile</span> to get 30% better matches.{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-primary underline"
              onClick={() => window.location.href = '/profile'}
            >
              Complete now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-sans">
                    Your Personalized Recommendations
                  </p>
                  <h2 className="text-3xl font-heading font-bold text-foreground">
                    ₹{savingsMin.toLocaleString()} - ₹{savingsMax.toLocaleString()}
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans mt-1">
                    Estimated annual savings potential
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className={confidenceColors[confidence as keyof typeof confidenceColors]}>
                  <ConfidenceIcon className="w-3 h-3 mr-1" />
                  {confidence} confidence
                </Badge>
                <span className="text-xs text-muted-foreground font-sans">
                  Updated {daysSinceCreated === 0 ? 'today' : `${daysSinceCreated} days ago`}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={onRefresh}
                variant="default"
                className="w-full lg:w-auto"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Recommendations
              </Button>
              <Button
                variant="outline"
                className="w-full lg:w-auto"
                onClick={() => window.location.href = '/profile'}
              >
                <User className="w-4 h-4 mr-2" />
                Update Preferences
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const calculateProfileCompleteness = (profile: any) => {
  if (!profile) return 0;
  
  let score = 0;
  const fields = ['age_range', 'income_band_inr', 'city'];
  
  fields.forEach(field => {
    if (profile[field]) score += (100 / fields.length);
  });
  
  return Math.round(score);
};
