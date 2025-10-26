import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard } from "@/data/cardData";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { useCompare } from "@/contexts/CompareContext";
import { CardDetailsModal } from "./CardDetailsModal";
import { toast } from "sonner";

interface CardTileProps {
  card: CreditCard;
}

export const CardTile = ({ card }: CardTileProps) => {
  const navigate = useNavigate();
  const { addCard, removeCard, isSelected, selectedCards } = useCompare();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleCompareToggle = (checked: boolean) => {
    if (checked) {
      if (selectedCards.length >= 3) {
        toast.error("You can compare up to 3 cards at a time");
        return;
      }
      addCard(card);
      toast.success(`${card.name} added to comparison`);
    } else {
      removeCard(card.id);
      toast.success(`${card.name} removed from comparison`);
    }
  };

  return (
    <>
      <div className="group bg-card/50 hover:bg-card rounded-2xl border border-border/30 hover:border-border/60 transition-all duration-300 p-6 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-playfair italic font-medium text-foreground mb-1">
            {card.name}
          </h3>
          <p className="text-sm font-sans text-muted-foreground">
            {card.issuer} • {card.network}
          </p>
        </div>

        <ul className="space-y-2 mb-4 flex-grow">
          {card.keyPerks.slice(0, 3).map((perk, idx) => (
            <li key={idx} className="text-sm font-sans text-muted-foreground flex items-start">
              <span className="mr-2">•</span>
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4">
          <p className="text-base font-sans text-foreground font-medium">
            {card.annualFee === 0 ? "Free" : `₹${card.annualFee.toLocaleString('en-IN')}/yr`}
          </p>
          {card.waiverRule && (
            <p className="text-xs font-sans text-muted-foreground mt-1">
              {card.waiverRule}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {card.categoryBadges.map(badge => (
            <Badge key={badge} variant="secondary" className="text-xs">
              {badge}
            </Badge>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                id={`compare-${card.id}`}
                checked={isSelected(card.id)}
                onCheckedChange={handleCompareToggle}
              />
              <label 
                htmlFor={`compare-${card.id}`}
                className="text-sm font-sans text-muted-foreground cursor-pointer"
              >
                compare
              </label>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDetailsOpen(true)}
              className="text-sm font-sans text-foreground hover:text-foreground/80"
            >
              details
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/auth")}
            className="w-full text-sm font-sans"
          >
            check fit →
          </Button>
        </div>
      </div>

      <CardDetailsModal 
        card={card}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
};
