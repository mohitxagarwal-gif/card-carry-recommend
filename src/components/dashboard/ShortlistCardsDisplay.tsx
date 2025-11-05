import { useState } from "react";
import { useCards } from "@/hooks/useCards";
import { useApplications } from "@/hooks/useApplications";
import { useShortlist } from "@/hooks/useShortlist";
import { Button } from "@/components/ui/button";
import { CardDetailsModal } from "@/components/CardDetailsModal";
import { IssuerOutlinkModal } from "@/components/IssuerOutlinkModal";
import { ExternalLink, FileText, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { CreditCard } from "@/hooks/useCards";
import type { NavigateFunction } from "react-router-dom";

interface ShortlistCardsDisplayProps {
  shortlistIds: string[];
  navigate: NavigateFunction;
}

export const ShortlistCardsDisplay = ({ shortlistIds, navigate }: ShortlistCardsDisplayProps) => {
  const { data: cards = [] } = useCards();
  const { getApplicationStatus } = useApplications();
  const { removeFromShortlist } = useShortlist();
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [outlinkModalOpen, setOutlinkModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string>("");

  const getCardById = (cardId: string) => cards.find(c => c.card_id === cardId);
  
  // Get top 3 shortlisted cards
  const shortlistedCards = shortlistIds
    .slice(0, 3)
    .map(id => getCardById(id))
    .filter((card): card is CreditCard => card !== undefined);

  const handleCardClick = (card: CreditCard) => {
    setSelectedCard(card);
    setDetailsModalOpen(true);
    trackEvent("dash_shortlist_card_click", { cardId: card.card_id });
  };

  const handleApplyClick = (e: React.MouseEvent, card: CreditCard) => {
    e.stopPropagation();
    if (!card?.application_url) return;

    const hideModal = localStorage.getItem('hide_outlink_modal') === 'true';
    
    if (hideModal) {
      window.open(card.application_url, '_blank');
      trackEvent("dash_shortlist_apply_direct", { cardId: card.card_id });
    } else {
      setSelectedCard(card);
      setPendingUrl(card.application_url);
      setOutlinkModalOpen(true);
      trackEvent("dash_shortlist_apply_modal", { cardId: card.card_id });
    }
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/applications');
    trackEvent("dash_shortlist_track_app");
  };

  const handleRemove = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    removeFromShortlist(cardId);
    trackEvent("dash_shortlist_remove", { cardId });
  };

  const handleOutlinkContinue = () => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank');
    }
    setOutlinkModalOpen(false);
    setPendingUrl("");
  };

  if (shortlistedCards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        save cards you like from your recommendations
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {shortlistedCards.map((card) => {
          const appStatus = getApplicationStatus(card.card_id);
          
          return (
            <div
              key={card.id}
              className="group cursor-pointer p-4 rounded-lg border border-hairline bg-card hover:bg-accent/50 transition-all relative"
              onClick={() => handleCardClick(card)}
            >
              {/* Remove button */}
              <button
                onClick={(e) => handleRemove(e, card.card_id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/10 transition-colors"
                aria-label="Remove from shortlist"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>

              <div className="flex items-start gap-4 pr-8">
                {/* Card Image */}
                <div className="flex-shrink-0 w-20 h-12 bg-muted rounded overflow-hidden">
                  {card.image_url && (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Card Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {card.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {card.issuer}
                    </p>
                  </div>

                  {/* Key Benefit */}
                  {card.key_perks && card.key_perks[0] && (
                    <p className="text-sm text-subtle line-clamp-1">
                      {card.key_perks[0]}
                    </p>
                  )}

                  {/* Action Button */}
                  {(() => {
                    if (appStatus === 'applied' || appStatus === 'approved' || appStatus === 'rejected') {
                      return (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full sm:w-auto"
                          onClick={handleTrackClick}
                        >
                          <FileText className="w-3 h-3 mr-2" />
                          track application
                        </Button>
                      );
                    }
                    
                    if (card.application_url) {
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={(e) => handleApplyClick(e, card)}
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          apply now
                        </Button>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </div>
            </div>
          );
        })}

        {shortlistIds.length > 3 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              navigate('/recs');
              trackEvent('dash_view_all_shortlist');
            }}
          >
            view all {shortlistIds.length} shortlisted cards
          </Button>
        )}
      </div>

      {/* Modals */}
      <CardDetailsModal
        card={selectedCard}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />

      {selectedCard && (
        <IssuerOutlinkModal
          isOpen={outlinkModalOpen}
          onClose={() => setOutlinkModalOpen(false)}
          onContinue={handleOutlinkContinue}
          issuerName={selectedCard.issuer}
          cardId={selectedCard.id}
        />
      )}
    </>
  );
};
