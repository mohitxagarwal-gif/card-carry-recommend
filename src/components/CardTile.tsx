import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard } from "@/hooks/useCards";
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
      <div className="group glass-surface glass-highlight rounded-card border border-hairline hover:shadow-glass-elevated transition-all duration-220 p-6 flex flex-col gloss-band hover:-translate-y-1.5">
        <div className="mb-4">
          <h3 className="text-xl font-heading font-bold text-ink mb-1 card-emboss-title">
            {card.name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {card.issuer}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {card.network}
            </Badge>
          </div>
        </div>

        <ul className="space-y-2 mb-4 flex-grow">
          {card.key_perks.slice(0, 3).map((perk, idx) => (
            <li key={idx} className="text-sm font-body text-subtle flex items-start">
              <span className="mr-2 text-primary">•</span>
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <div className="mb-4">
          <p className="text-base font-body text-ink font-semibold tabular-nums card-emboss-badge inline-block px-3 py-1 rounded-pill bg-muted">
            {card.annual_fee === 0 ? "free" : `₹${card.annual_fee.toLocaleString('en-IN')}/yr`}
          </p>
          {card.waiver_rule && (
            <p className="text-xs font-body text-subtle mt-1">
              {card.waiver_rule}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {card.category_badges.map(badge => (
            <Badge key={badge} variant="secondary" className="text-xs">
              {badge}
            </Badge>
          ))}
        </div>

        <div className="space-y-3 pt-4 border-t border-hairline">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                id={`compare-${card.id}`}
                checked={isSelected(card.id)}
                onCheckedChange={handleCompareToggle}
              />
              <label 
                htmlFor={`compare-${card.id}`}
                className="text-sm font-body text-subtle cursor-pointer"
              >
                compare
              </label>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDetailsOpen(true)}
              className="text-sm font-body"
            >
              details
            </Button>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate("/auth")}
            className="w-full text-sm font-body gloss-band"
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
