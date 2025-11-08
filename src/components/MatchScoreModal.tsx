import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface MatchScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  matchScore: number;
  scoreBreakdown?: {
    feeScore?: number;
    categoryScore?: number;
    travelScore?: number;
    networkScore?: number;
    spendingMatch?: number;
  };
  explanation?: string[];
}

export const MatchScoreModal = ({
  isOpen,
  onClose,
  cardName,
  matchScore,
  scoreBreakdown = {},
  explanation = []
}: MatchScoreModalProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Match Score Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{cardName}</h3>
                <div className={`text-5xl font-bold ${getScoreColor(matchScore)}`}>
                  {matchScore}
                </div>
                <Badge variant="secondary">{getScoreLabel(matchScore)} Match</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          {Object.keys(scoreBreakdown).length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Score Breakdown</h4>
              
              {scoreBreakdown.feeScore !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fee Affordability</span>
                    <span className="font-semibold">{scoreBreakdown.feeScore}/100</span>
                  </div>
                  <Progress value={scoreBreakdown.feeScore} className="h-2" />
                </div>
              )}

              {scoreBreakdown.categoryScore !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Category Alignment</span>
                    <span className="font-semibold">{scoreBreakdown.categoryScore}/100</span>
                  </div>
                  <Progress value={scoreBreakdown.categoryScore} className="h-2" />
                </div>
              )}

              {scoreBreakdown.travelScore !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Travel Benefits</span>
                    <span className="font-semibold">{scoreBreakdown.travelScore}/100</span>
                  </div>
                  <Progress value={scoreBreakdown.travelScore} className="h-2" />
                </div>
              )}

              {scoreBreakdown.networkScore !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network Acceptance</span>
                    <span className="font-semibold">{scoreBreakdown.networkScore}/100</span>
                  </div>
                  <Progress value={scoreBreakdown.networkScore} className="h-2" />
                </div>
              )}

              {scoreBreakdown.spendingMatch !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spending Level Match</span>
                    <span className="font-semibold">{scoreBreakdown.spendingMatch}/100</span>
                  </div>
                  <Progress value={scoreBreakdown.spendingMatch} className="h-2" />
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
          {explanation.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Why This Score?</h4>
              <ul className="space-y-2">
                {explanation.map((point, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};