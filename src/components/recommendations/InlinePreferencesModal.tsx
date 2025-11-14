import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface InlinePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  analysisId?: string | null;
}

export const InlinePreferencesModal = ({ isOpen, onClose, onSave, analysisId }: InlinePreferencesModalProps) => {
  const { preferences, updatePreferences } = useUserPreferences();
  const { refreshRecommendations, isRefreshing } = useRecommendationSnapshot();
  const [hasChanges, setHasChanges] = useState(false);

  const handlePreferenceChange = (updates: any) => {
    updatePreferences(updates);
    setHasChanges(true);
  };

  const handleRefresh = async () => {
    if (!analysisId) {
      toast.error("No analysis data available. Please upload statements first.");
      return;
    }
    
    await refreshRecommendations(analysisId);
    setHasChanges(false);
    onSave?.();
  };

  const handleClose = () => {
    setHasChanges(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Edit Your Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>💰 Fee Sensitivity</Label>
            <Select 
              value={preferences?.fee_sensitivity || 'medium'}
              onValueChange={(value) => handlePreferenceChange({ fee_sensitivity: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - I don't mind fees</SelectItem>
                <SelectItem value="medium">Medium - Some fees are okay</SelectItem>
                <SelectItem value="high">High - Prefer low/no fees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>✈️ Travel Frequency</Label>
            <Select 
              value={preferences?.travel_frequency || 'occasional'}
              onValueChange={(value) => handlePreferenceChange({ travel_frequency: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="occasional">Occasional (1-2 times/year)</SelectItem>
                <SelectItem value="frequent">Frequent (3-6 times/year)</SelectItem>
                <SelectItem value="very_frequent">Very Frequent (7+ times/year)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>🛋️ Lounge Access Importance</Label>
            <Select 
              value={preferences?.lounge_importance || 'medium'}
              onValueChange={(value) => handlePreferenceChange({ lounge_importance: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Not important</SelectItem>
                <SelectItem value="medium">Medium - Nice to have</SelectItem>
                <SelectItem value="high">High - Very important</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>🎁 Reward Preference</Label>
            <Select 
              value={preferences?.preference_type || 'cashback'}
              onValueChange={(value) => handlePreferenceChange({ preference_type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cashback">Cashback</SelectItem>
                <SelectItem value="points">Reward Points</SelectItem>
                <SelectItem value="both">Flexible/Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasChanges && analysisId && (
          <Alert className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Preferences updated! Click "Refresh Recommendations" to see personalized suggestions.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2 pt-4 border-t border-border">
          {hasChanges && analysisId && (
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing Recommendations...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Recommendations
                </>
              )}
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
            <Button onClick={handleClose} className="flex-1" disabled={isRefreshing}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
