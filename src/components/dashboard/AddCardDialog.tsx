import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserCards } from "@/hooks/useUserCards";
import { useCards } from "@/hooks/useCards";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddCardDialog = ({ open, onOpenChange }: AddCardDialogProps) => {
  const { addCard } = useUserCards();
  const { data: cards = [] } = useCards();
  const [selectedCardId, setSelectedCardId] = useState("");
  const [openedMonth, setOpenedMonth] = useState("");
  const [renewalMonth, setRenewalMonth] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId) return;

    addCard({
      card_id: selectedCardId,
      opened_month: openedMonth || undefined,
      renewal_month: renewalMonth || undefined,
    });

    // Reset form
    setSelectedCardId("");
    setOpenedMonth("");
    setRenewalMonth("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>add your card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-select">select card</Label>
            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger id="card-select">
                <SelectValue placeholder="choose a card..." />
              </SelectTrigger>
              <SelectContent>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name} - {card.issuer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opened-month">opened month (optional)</Label>
            <Input
              id="opened-month"
              type="month"
              value={openedMonth}
              onChange={(e) => setOpenedMonth(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewal-month">renewal month (optional)</Label>
            <Input
              id="renewal-month"
              type="month"
              value={renewalMonth}
              onChange={(e) => setRenewalMonth(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              cancel
            </Button>
            <Button type="submit" disabled={!selectedCardId}>
              add card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
