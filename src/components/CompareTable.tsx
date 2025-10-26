import { useNavigate } from "react-router-dom";
import { CreditCard } from "@/data/cardData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface CompareTableProps {
  cards: CreditCard[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CompareTable = ({ cards, open, onOpenChange }: CompareTableProps) => {
  const navigate = useNavigate();

  if (cards.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-2xl">compare cards</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-full">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-4 font-sans font-medium text-sm text-muted-foreground sticky left-0 bg-background z-10">
                    Feature
                  </th>
                  {cards.map(card => (
                    <th key={card.id} className="text-left p-4 min-w-[200px]">
                      <div className="font-heading font-bold text-foreground">
                        {card.name}
                      </div>
                      <div className="text-xs font-sans text-muted-foreground mt-1">
                        {card.issuer} • {card.network}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/10">
                  <td className="p-4 font-sans text-sm font-medium sticky left-0 bg-background z-10">
                    Annual Fee
                  </td>
                  {cards.map(card => (
                    <td key={card.id} className="p-4 font-sans text-sm">
                      <div>{card.annualFee === 0 ? "Free" : `₹${card.annualFee.toLocaleString('en-IN')}`}</div>
                      {card.waiverRule && (
                        <div className="text-xs text-muted-foreground mt-1">{card.waiverRule}</div>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/10">
                  <td className="p-4 font-sans text-sm font-medium sticky left-0 bg-background z-10">
                    Welcome Bonus
                  </td>
                  {cards.map(card => (
                    <td key={card.id} className="p-4 font-sans text-sm">
                      {card.welcomeBonus}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/10">
                  <td className="p-4 font-sans text-sm font-medium sticky left-0 bg-background z-10">
                    Rewards Structure
                  </td>
                  {cards.map(card => (
                    <td key={card.id} className="p-4 font-sans text-sm">
                      {card.rewardStructure}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/10">
                  <td className="p-4 font-sans text-sm font-medium sticky left-0 bg-background z-10">
                    Lounge Access
                  </td>
                  {cards.map(card => (
                    <td key={card.id} className="p-4 font-sans text-sm">
                      {card.loungeAccess}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/10">
                  <td className="p-4 font-sans text-sm font-medium sticky left-0 bg-background z-10">
                    Forex Markup
                  </td>
                  {cards.map(card => (
                    <td key={card.id} className="p-4 font-sans text-sm">
                      {card.forexMarkup}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/10">
                  <td className="p-4 font-sans text-sm font-medium sticky left-0 bg-background z-10">
                    Ideal For
                  </td>
                  {cards.map(card => (
                    <td key={card.id} className="p-4 font-sans text-sm">
                      {card.idealFor.join(", ")}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/10">
                  <td className="p-4 font-sans text-sm font-medium sticky left-0 bg-background z-10">
                    Downsides
                  </td>
                  {cards.map(card => (
                    <td key={card.id} className="p-4 font-sans text-sm">
                      {card.downsides.join(", ")}
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-border/10">
                  <td className="p-4 font-sans text-sm font-medium sticky left-0 bg-background z-10">
                    Categories
                  </td>
                  {cards.map(card => (
                    <td key={card.id} className="p-4 font-sans text-sm">
                      {card.categoryBadges.join(", ")}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 bg-background border-t border-border/30 pt-4 mt-4">
          <Button
            onClick={() => navigate("/auth")}
            className="w-full font-sans"
          >
            Which one fits me? →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
