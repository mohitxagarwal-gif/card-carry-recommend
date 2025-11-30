import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEligibilityScore } from "@/hooks/useEligibilityScore";

export const EligibilityCenter = () => {
  const navigate = useNavigate();
  const { data: eligibility, isLoading } = useEligibilityScore();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">Loading eligibility...</div>
        </CardContent>
      </Card>
    );
  }

  if (!eligibility) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {eligibility.overall >= 80 ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          Eligibility Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(eligibility.overall)}`}>
              {eligibility.overall}%
            </span>
          </div>
          <Progress value={eligibility.overall} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {getScoreLabel(eligibility.overall)} - {eligibility.overall >= 80 
              ? "You qualify for most premium cards" 
              : "Complete your profile to improve eligibility"}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Score Breakdown</h4>
          {Object.entries(eligibility.breakdown).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="capitalize min-w-0 truncate">{key}</span>
                <span className={`${getScoreColor(value as number)} flex-shrink-0`}>{value}%</span>
              </div>
              <Progress value={value as number} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Missing Fields */}
        {eligibility.missingFields.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4 space-y-2">
            <h4 className="text-sm font-semibold text-yellow-700">Missing Information</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {eligibility.missingFields.map((field) => (
                <li key={field} className="flex items-start gap-2">
                  <span className="text-yellow-600 flex-shrink-0">•</span>
                  <span className="flex-1 min-w-0">{field}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {eligibility.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recommendations</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              {eligibility.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action */}
        {eligibility.overall < 80 && (
          <Button 
            onClick={() => navigate('/profile')} 
            className="w-full"
            variant="outline"
          >
            Complete Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
