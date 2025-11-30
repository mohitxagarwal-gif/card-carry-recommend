import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { useCards } from "@/hooks/useCards";
import { useApplications } from "@/hooks/useApplications";
import { CardDetailsModal } from "@/components/CardDetailsModal";
import { IssuerOutlinkModal } from "@/components/IssuerOutlinkModal";
import { Sparkles, ExternalLink, Upload, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";
import { CreditCard } from "@/hooks/useCards";

export const RecommendedCardsModule = () => {
  const navigate = useNavigate();
  const { latestSnapshot, isLoading: snapshotLoading } = useRecommendationSnapshot();
  const { data: cards = [] } = useCards();
  const { getApplicationStatus } = useApplications();
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [outlinkModalOpen, setOutlinkModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string>("");

  // Match recommendation card by name (since recommended_cards stores full names, not card_ids)
  const getCardByName = (cardName: string) => {
    // Try exact match first
    const exactMatch = cards.find(c => 
      c.name.toLowerCase() === cardName.toLowerCase() ||
      c.name.toLowerCase().includes(cardName.toLowerCase()) ||
      cardName.toLowerCase().includes(c.name.toLowerCase())
    );
    return exactMatch;
  };

  if (snapshotLoading) return null;

  // No recommendations - show CTA
  if (!latestSnapshot || !latestSnapshot.recommended_cards || latestSnapshot.recommended_cards.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
          <h3 className="text-xl font-semibold">get personalized recommendations</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            upload your statements to see which cards could save you the most money
          </p>
          <Button onClick={() => navigate("/upload")}>
            upload statements
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show top 2-3 recommended cards
  const topCards = latestSnapshot.recommended_cards.slice(0, 3);

  const handleCardClick = (card: CreditCard) => {
    setSelectedCard(card);
    setDetailsModalOpen(true);
    trackEvent("dash_rec_card_click", { cardId: card.card_id });
  };

  const handleApplyClick = (e: React.MouseEvent, card: CreditCard) => {
    e.stopPropagation();
    if (!card?.application_url) return;

    const hideModal = localStorage.getItem('hide_outlink_modal') === 'true';
    
    if (hideModal) {
      window.open(card.application_url, '_blank');
      trackEvent("dash_rec_apply_direct", { cardId: card.card_id });
    } else {
      setSelectedCard(card);
      setPendingUrl(card.application_url);
      setOutlinkModalOpen(true);
      trackEvent("dash_rec_apply_modal", { cardId: card.card_id });
    }
  };

  const handleTrackClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate('/applications');
    trackEvent("dash_rec_track_app");
  };

  const handleOutlinkContinue = () => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank');
    }
    setOutlinkModalOpen(false);
    setPendingUrl("");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            your top recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCards.map((recCard: any, index: number) => {
              const card = getCardByName(recCard.name);
              if (!card) {
                console.warn('Card not found for recommendation:', recCard.name);
                return null;
              }

              // Extract estimated savings from the recommendation
              const estimatedSavings = recCard.estimatedSavings 
                ? parseInt(recCard.estimatedSavings.match(/₹([\d,]+)/)?.[1]?.replace(/,/g, '') || '0')
                : null;

              return (
                <div
                  key={`${card.id}-${index}`}
                  className="group cursor-pointer p-4 rounded-lg border border-hairline bg-card hover:bg-accent/50 transition-all"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="flex items-start gap-4">
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
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {card.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {card.issuer}
                          </p>
                        </div>
                        {estimatedSavings && (
                          <Badge variant="secondary" className="flex-shrink sm:flex-shrink-0 whitespace-nowrap">
                            Save ₹{estimatedSavings.toLocaleString()}/year
                          </Badge>
                        )}
                      </div>

                      {/* Key Benefit - Show recommendation reason */}
                      {recCard.reason && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {recCard.reason}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        {(() => {
                          const appStatus = getApplicationStatus(card.card_id);
                          
                          // If user has applied, show Track Application
                          if (appStatus === 'applied' || appStatus === 'approved' || appStatus === 'rejected') {
                            return (
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1"
                                onClick={handleTrackClick}
                              >
                                <FileText className="w-3 h-3 mr-2" />
                                track application
                              </Button>
                            );
                          }
                          
                          // Default: Show Apply Now
                          if (card.application_url) {
                            return (
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1"
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
                </div>
              );
            })}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                navigate('/recs');
                trackEvent('dash_view_all_recs');
              }}
            >
              view all recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CardDetailsModal
        card={selectedCard}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        applicationStatus={selectedCard ? getApplicationStatus(selectedCard.card_id) : null}
        onApplyClick={(card) => handleApplyClick(new MouseEvent('click') as any, card)}
        onTrackClick={handleTrackClick}
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
