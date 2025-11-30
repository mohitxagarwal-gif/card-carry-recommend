import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Edit, X } from "lucide-react";
import { useUserCards } from "@/hooks/useUserCards";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const MyCardsModule = () => {
  const { userCards, isLoading, addCard, updateCard, closeCard, getActiveCards } = useUserCards();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    card_id: "",
    opened_month: "",
    renewal_month: "",
    forex_pct: "",
    lounge_quota_total: "",
  });

  const activeCards = getActiveCards();

  const handleAddCard = () => {
    addCard({
      card_id: cardForm.card_id,
      opened_month: cardForm.opened_month || undefined,
      renewal_month: cardForm.renewal_month || undefined,
      forex_pct: cardForm.forex_pct ? parseFloat(cardForm.forex_pct) : undefined,
      lounge_quota_total: cardForm.lounge_quota_total ? parseInt(cardForm.lounge_quota_total) : undefined,
    });
    setIsAddModalOpen(false);
    setCardForm({ card_id: "", opened_month: "", renewal_month: "", forex_pct: "", lounge_quota_total: "" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-playfair">My Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading cards...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-playfair">My Cards</CardTitle>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Your Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="card_id">Card ID *</Label>
                <Input
                  id="card_id"
                  value={cardForm.card_id}
                  onChange={(e) => setCardForm({ ...cardForm, card_id: e.target.value })}
                  placeholder="e.g., hdfc-diners-privilege"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opened_month">Opened Month</Label>
                  <Input
                    id="opened_month"
                    type="month"
                    value={cardForm.opened_month}
                    onChange={(e) => setCardForm({ ...cardForm, opened_month: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="renewal_month">Renewal Month</Label>
                  <Input
                    id="renewal_month"
                    type="month"
                    value={cardForm.renewal_month}
                    onChange={(e) => setCardForm({ ...cardForm, renewal_month: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="forex_pct">Forex % (e.g., 3.5)</Label>
                  <Input
                    id="forex_pct"
                    type="number"
                    step="0.1"
                    value={cardForm.forex_pct}
                    onChange={(e) => setCardForm({ ...cardForm, forex_pct: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lounge_quota">Lounge Quota</Label>
                  <Input
                    id="lounge_quota"
                    type="number"
                    value={cardForm.lounge_quota_total}
                    onChange={(e) => setCardForm({ ...cardForm, lounge_quota_total: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddCard} disabled={!cardForm.card_id} className="w-full">
                Add Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {activeCards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Add cards you own to track renewals and quotas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCards.map((card) => (
              <div
                key={card.id}
                className="border border-border rounded-lg p-3 sm:p-4 space-y-2 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{card.card_id}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {card.renewal_month && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          Renews: {new Date(card.renewal_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => closeCard(card.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {card.forex_pct && (
                    <div>Forex: {card.forex_pct}%</div>
                  )}
                  {card.lounge_quota_total && (
                    <div>Lounge: {card.lounge_used || 0}/{card.lounge_quota_total}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
