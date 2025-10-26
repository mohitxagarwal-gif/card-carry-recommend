import { useNavigate } from "react-router-dom";
import { CreditCard } from "@/hooks/useCards";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ExternalLinkIcon } from "lucide-react";

interface CardDetailsModalProps {
  card: CreditCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CardDetailsModal = ({ card, open, onOpenChange }: CardDetailsModalProps) => {
  const navigate = useNavigate();

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-playfair italic text-2xl mb-2">
                {card.name}
              </DialogTitle>
              <p className="text-sm font-sans text-muted-foreground">
                {card.issuer} • {card.network}
              </p>
            </div>
            <Button onClick={() => navigate("/auth")} className="font-sans">
              Get personalized picks
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {/* Key Facts */}
            <div className="bg-card/30 rounded-xl p-6 border border-border/30">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-sans text-muted-foreground mb-1">Annual Fee</p>
                  <p className="text-lg font-sans font-medium text-foreground">
                    {card.annual_fee === 0 ? "Free" : `₹${card.annual_fee.toLocaleString('en-IN')}`}
                  </p>
                  {card.waiver_rule && (
                    <p className="text-xs font-sans text-muted-foreground mt-1">{card.waiver_rule}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-sans text-muted-foreground mb-1">Forex Markup</p>
                  <p className="text-lg font-sans font-medium text-foreground">{card.forex_markup}</p>
                </div>
                <div>
                  <p className="text-xs font-sans text-muted-foreground mb-1">Reward Type</p>
                  <p className="text-lg font-sans font-medium text-foreground">
                    {card.reward_type.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-sans text-muted-foreground mb-1">Network</p>
                  <p className="text-lg font-sans font-medium text-foreground">{card.network}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="benefits" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="benefits" className="font-sans text-xs md:text-sm">Benefits</TabsTrigger>
                <TabsTrigger value="fees" className="font-sans text-xs md:text-sm">Fees & Rewards</TabsTrigger>
                <TabsTrigger value="eligibility" className="font-sans text-xs md:text-sm">Eligibility</TabsTrigger>
                <TabsTrigger value="details" className="font-sans text-xs md:text-sm">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="benefits" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-2">Key Perks</h4>
                  <ul className="space-y-2">
                    {card.key_perks.map((perk, idx) => (
                      <li key={idx} className="text-sm font-sans text-muted-foreground flex items-start">
                        <span className="mr-2">•</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-2">Lounge Access</h4>
                  <p className="text-sm font-sans text-muted-foreground">{card.lounge_access}</p>
                </div>

                {card.welcome_bonus !== "None" && (
                  <div>
                    <h4 className="text-sm font-sans font-medium text-foreground mb-2">Welcome Bonus</h4>
                    <p className="text-sm font-sans text-muted-foreground">{card.welcome_bonus}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="fees" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-2">Annual Fee</h4>
                  <p className="text-sm font-sans text-muted-foreground">
                    {card.annual_fee === 0 ? "Free" : `₹${card.annual_fee.toLocaleString('en-IN')}`}
                  </p>
                  {card.waiver_rule && (
                    <p className="text-xs font-sans text-muted-foreground mt-1">{card.waiver_rule}</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-2">Rewards Structure</h4>
                  <p className="text-sm font-sans text-muted-foreground">{card.reward_structure}</p>
                </div>

                <div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-2">Forex Markup</h4>
                  <p className="text-sm font-sans text-muted-foreground">{card.forex_markup}</p>
                </div>
              </TabsContent>

              <TabsContent value="eligibility" className="space-y-4 mt-4">
                {card.eligibility && (
                  <div>
                    <h4 className="text-sm font-sans font-medium text-foreground mb-2">Income Requirements</h4>
                    <p className="text-sm font-sans text-muted-foreground">{card.eligibility}</p>
                  </div>
                )}

                {card.docs_required && (
                  <div>
                    <h4 className="text-sm font-sans font-medium text-foreground mb-2">Documents Required</h4>
                    <p className="text-sm font-sans text-muted-foreground">{card.docs_required}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-2">Ideal For</h4>
                  <div className="flex flex-wrap gap-2">
                    {card.ideal_for.map(item => (
                      <Badge key={item} variant="secondary" className="font-sans">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-2">Downsides</h4>
                  <ul className="space-y-2">
                    {card.downsides.map((downside, idx) => (
                      <li key={idx} className="text-sm font-sans text-muted-foreground flex items-start">
                        <span className="mr-2">•</span>
                        <span>{downside}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-sans font-medium text-foreground mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {card.category_badges.map(badge => (
                      <Badge key={badge} variant="outline" className="font-sans">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>

                {card.tnc_url && (
                  <div>
                    <a
                      href={card.tnc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-sans text-primary hover:underline"
                    >
                      View official T&Cs
                      <ExternalLinkIcon className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
