import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, CheckCircle } from "lucide-react";
import { useShortlist } from "@/hooks/useShortlist";
import { trackEvent } from "@/lib/analytics";

interface CardActionBarProps {
  cardId: string;
  issuer: string;
  name: string;
}

export const CardActionBar = ({ cardId, issuer, name }: CardActionBarProps) => {
  const { isInShortlist, addToShortlist, removeFromShortlist } = useShortlist();
  const inShortlist = isInShortlist(cardId);

  const handleEligibilityCheck = () => {
    trackEvent("recs_eligibility_click", { cardId, issuer });
    // Open issuer eligibility page - placeholder URL
    window.open(`https://${issuer.toLowerCase().replace(/\s/g, '')}.com/check-eligibility`, '_blank');
  };

  const handleApply = () => {
    trackEvent("recs_apply_click", { cardId, issuer });
    // Open issuer application page - placeholder URL
    window.open(`https://${issuer.toLowerCase().replace(/\s/g, '')}.com/apply/${cardId}`, '_blank');
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
    </div>
  );
};
