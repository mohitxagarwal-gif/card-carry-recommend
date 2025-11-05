import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsHeaderProps {
  onExport?: () => void;
}

export const AnalyticsHeader = ({ onExport }: AnalyticsHeaderProps) => {
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      toast.info("Export functionality coming soon");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor platform metrics and user activity
        </p>
      </div>
      <Button onClick={handleExport} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export Data
      </Button>
    </div>
  );
};
