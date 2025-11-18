import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, CheckCircle } from "lucide-react";
import { useShortlist } from "@/hooks/useShortlist";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { trackEvent as trackMixpanelEvent } from "@/lib/analytics";
import { IssuerOutlinkModal } from "./IssuerOutlinkModal";
import { EligibilityDetailsModal } from "./EligibilityDetailsModal";
import { useState } from "react";

interface CardActionBarProps {
  cardId: string;
  issuer: string;
  name: string;
}

export const CardActionBar = ({ cardId, issuer, name }: CardActionBarProps) => {
  const { isInShortlist, addToShortlist, removeFromShortlist } = useShortlist();
  const inShortlist = isInShortlist(cardId);
  const [showOutlinkModal, setShowOutlinkModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");
  const [pendingAction, setPendingAction] = useState<"eligibility" | "apply" | null>(null);

  const handleEligibilityCheck = () => {
    trackEvent("recs_eligibility_click", { cardId, issuer });
    setShowEligibilityModal(true);
  };

  const handleApply = () => {
    const hideModal = localStorage.getItem('hide_outlink_modal') === 'true';
    const url = `https://${issuer.toLowerCase().replace(/\s/g, '')}.com/apply/${cardId}`;
    
    // Mixpanel event
    trackMixpanelEvent('card.apply_clicked', {
      cardId,
      source: 'action_bar',
    });
    
    if (hideModal) {
      trackEvent("recs_apply_click", { cardId, issuer });
      window.open(url, '_blank');
    } else {
      setPendingUrl(url);
      setPendingAction("apply");
      setShowOutlinkModal(true);
    }
  };

  const handleModalContinue = () => {
    if (pendingAction === "eligibility") {
      trackEvent("recs_eligibility_click", { cardId, issuer });
    } else if (pendingAction === "apply") {
      trackEvent("recs_apply_click", { cardId, issuer });
    }
    window.open(pendingUrl, '_blank');
    setShowOutlinkModal(false);
    setPendingUrl("");
    setPendingAction(null);
  };

  const handleShortlist = () => {
    if (inShortlist) {
      removeFromShortlist(cardId);
    } else {
      addToShortlist(cardId);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleEligibilityCheck}
        className="flex-1 sm:flex-none"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Check Eligibility
      </Button>
      
      <Button
        size="sm"
        onClick={handleApply}
        className="flex-1 sm:flex-none"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Apply Now
      </Button>

      <Button
        variant={inShortlist ? "default" : "outline"}
        size="sm"
        onClick={handleShortlist}
      >
        <Heart className={`w-4 h-4 ${inShortlist ? 'fill-current' : ''}`} />
      </Button>

      <EligibilityDetailsModal
        isOpen={showEligibilityModal}
        onClose={() => setShowEligibilityModal(false)}
        cardId={cardId}
        cardName={name}
      />

      <IssuerOutlinkModal
        isOpen={showOutlinkModal}
        onClose={() => {
          setShowOutlinkModal(false);
          setPendingUrl("");
          setPendingAction(null);
        }}
        onContinue={handleModalContinue}
        issuerName={issuer}
        cardId={cardId}
      />
    </div>
  );
};
