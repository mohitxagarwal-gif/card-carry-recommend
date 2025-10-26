import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface RecommendationSummaryPanelProps {
  savingsMin: number;
  savingsMax: number;
  confidence: 'low' | 'medium' | 'high';
  nextAction?: string;
}

export const RecommendationSummaryPanel = ({
  savingsMin,
  savingsMax,
  confidence,
  nextAction
}: RecommendationSummaryPanelProps) => {
  const handleEmailSummary = () => {
    toast.info("Email feature coming soon!");
  };

  const handleDownloadPDF = () => {
    toast.info("PDF export coming soon!");
  };

  const confidenceColor = {
    low: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    medium: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    high: 'bg-green-500/10 text-green-700 border-green-500/20',
  }[confidence];

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Estimated Annual Savings</h3>
              <Badge variant="outline" className={confidenceColor}>
                {confidence} confidence
              </Badge>
            </div>
            <p className="text-3xl font-playfair italic text-primary">
              ₹{savingsMin.toLocaleString()} - ₹{savingsMax.toLocaleString()}
            </p>
            {nextAction && (
              <p className="text-sm text-muted-foreground">
                <strong>Next best action:</strong> {nextAction}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEmailSummary}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
