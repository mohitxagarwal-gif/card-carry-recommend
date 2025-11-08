import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useEligibilityScore } from "@/hooks/useEligibilityScore";
import { Skeleton } from "@/components/ui/skeleton";

interface EligibilityDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  cardName: string;
}

export const EligibilityDetailsModal = ({
  isOpen,
  onClose,
  cardId,
  cardName,
}: EligibilityDetailsModalProps) => {
  const { data: eligibility, isLoading } = useEligibilityScore(cardId);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-700 border-green-500/20";
    if (score >= 60) return "bg-amber-500/10 text-amber-700 border-amber-500/20";
    return "bg-red-500/10 text-red-700 border-red-500/20";
  };

  const getCategoryIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-4 h-4 text-amber-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">
            Eligibility Check: {cardName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : eligibility ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-muted/30 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className={`text-5xl font-bold ${getScoreColor(eligibility.overall)}`}>
                  {eligibility.overall}%
                </span>
                <Badge variant="secondary" className={getScoreBadgeClass(eligibility.overall)}>
                  {getScoreLabel(eligibility.overall)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Overall Eligibility Score
              </p>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Score Breakdown</h3>
              
              <div className="space-y-3">
                {Object.entries(eligibility.breakdown).map(([category, score]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(score)}
                        <span className="text-sm font-medium capitalize">
                          {category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Fields */}
            {eligibility.missingFields.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                      Missing Information
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                      Complete your profile to get a more accurate eligibility score:
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      {eligibility.missingFields.map((field, idx) => (
                        <li key={idx}>• {field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {eligibility.recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-heading font-semibold text-lg">Recommendations</h3>
                <ul className="space-y-2">
                  {eligibility.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Unable to calculate eligibility. Please complete your profile.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
