import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface InlinePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const InlinePreferencesModal = ({ isOpen, onClose, onSave }: InlinePreferencesModalProps) => {
  const { preferences, updatePreferences } = useUserPreferences();

  const handleSave = () => {
    onSave?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              onValueChange={(value) => updatePreferences({ fee_sensitivity: value as any })}
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
              onValueChange={(value) => updatePreferences({ travel_frequency: value as any })}
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
              onValueChange={(value) => updatePreferences({ lounge_importance: value as any })}
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
              onValueChange={(value) => updatePreferences({ preference_type: value as any })}
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

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
