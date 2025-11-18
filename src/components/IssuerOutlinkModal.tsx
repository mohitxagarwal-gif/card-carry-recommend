import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { trackEvent as trackMixpanelEvent } from "@/lib/analytics";

interface IssuerOutlinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  issuerName: string;
  cardId: string;
}

export const IssuerOutlinkModal = ({
  isOpen,
  onClose,
  onContinue,
  issuerName,
  cardId,
}: IssuerOutlinkModalProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_outlink_modal', 'true');
    }
    
    trackEvent("issuer_outlink_modal_continue", { cardId, issuer: issuerName });
    
    // Mixpanel event
    trackMixpanelEvent('card.issuer_link_opened', {
      cardId,
      issuer: issuerName,
      source: 'issuer_modal',
    });
    
    onContinue();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            You're leaving Card & Carry
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            We're redirecting you to <span className="font-medium text-foreground">{issuerName}</span>. 
            Please verify all terms and conditions on their official website.
          </p>
          <div className="bg-accent/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Affiliate Disclosure:</strong> This may be an affiliate link. 
              We may earn a commission at no additional cost to you. This helps us keep Card & Carry free.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label
              htmlFor="dont-show"
              className="text-sm font-normal cursor-pointer"
            >
              Don't show this again
            </Label>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleContinue}>
            Continue to {issuerName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
