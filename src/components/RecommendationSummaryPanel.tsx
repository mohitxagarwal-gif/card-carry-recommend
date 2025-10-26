import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportRecommendationsPDF } from "@/lib/exportPDF";
import { trackEvent } from "@/lib/analytics";

interface RecommendationSummaryPanelProps {
  savingsMin: number;
  savingsMax: number;
  confidence: 'low' | 'medium' | 'high';
  nextAction?: string;
  snapshotId?: string;
  recommendedCards?: any[];
}

export const RecommendationSummaryPanel = ({
  savingsMin,
  savingsMax,
  confidence,
  nextAction,
  snapshotId,
  recommendedCards = []
}: RecommendationSummaryPanelProps) => {
  const handleEmailSummary = async () => {
    if (!snapshotId) {
      toast.error("No snapshot available");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('email-summary', {
        body: { snapshotId }
      });

      if (error) throw error;
      
      toast.success("Email sent successfully!");
      trackEvent("recs_email_summary", { snapshotId });
    } catch (error: any) {
      console.error("Email error:", error);
      if (error.message?.includes("not configured")) {
        toast.error("Email service not configured");
      } else {
        toast.error("Failed to send email");
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      exportRecommendationsPDF(
        { savings_min: savingsMin, savings_max: savingsMax, confidence } as any,
        recommendedCards,
        profile || { full_name: null, email: user.email || "" }
      );

      toast.success("PDF downloaded!");
      trackEvent("recs_export_pdf");
    } catch (error) {
      console.error("PDF error:", error);
      toast.error("Failed to generate PDF");
    }
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
