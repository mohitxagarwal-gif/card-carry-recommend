import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecommendationSnapshot } from "@/hooks/useRecommendationSnapshot";
import { useCards } from "@/hooks/useCards";
import { CardDetailsModal } from "@/components/CardDetailsModal";
import { IssuerOutlinkModal } from "@/components/IssuerOutlinkModal";
import { Sparkles, ExternalLink, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { CreditCard } from "@/hooks/useCards";

export const RecommendedCardsModule = () => {
  const navigate = useNavigate();
  const { latestSnapshot, isLoading: snapshotLoading } = useRecommendationSnapshot();
  const { data: cards = [] } = useCards();
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [outlinkModalOpen, setOutlinkModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string>("");

  const getCardById = (cardId: string) => cards.find(c => c.id === cardId);

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

  const handleCardClick = (cardId: string) => {
    const card = getCardById(cardId);
    if (card) {
      setSelectedCard(card);
      setDetailsModalOpen(true);
      trackEvent("dash_rec_card_click", { cardId });
    }
  };

  const handleApplyClick = (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    const card = getCardById(cardId);
    if (!card?.application_url) return;

    const hideModal = localStorage.getItem('hide_outlink_modal') === 'true';
    
    if (hideModal) {
      window.open(card.application_url, '_blank');
      trackEvent("dash_rec_apply_direct", { cardId });
    } else {
      setSelectedCard(card);
      setPendingUrl(card.application_url);
      setOutlinkModalOpen(true);
      trackEvent("dash_rec_apply_modal", { cardId });
    }
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
            {topCards.map((recCard: any) => {
              const card = getCardById(recCard.card_id);
              if (!card) return null;

              return (
                <div
                  key={card.id}
                  className="group cursor-pointer p-4 rounded-lg border border-hairline bg-card hover:bg-accent/50 transition-all"
                  onClick={() => handleCardClick(card.id)}
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
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {card.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {card.issuer}
                          </p>
                        </div>
                        {recCard.estimated_savings && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            Save ₹{recCard.estimated_savings.toLocaleString()}
                          </Badge>
                        )}
                      </div>

                      {/* Key Benefit */}
                      {card.key_perks && card.key_perks[0] && (
                        <p className="text-sm text-subtle line-clamp-1">
                          {card.key_perks[0]}
                        </p>
                      )}

                      {/* Apply Button */}
                      {card.application_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={(e) => handleApplyClick(e, card.id)}
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          apply now
                        </Button>
                      )}
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
