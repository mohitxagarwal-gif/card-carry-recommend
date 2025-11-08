import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard } from "@/hooks/useCards";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { useCompare } from "@/contexts/CompareContext";
import { CardDetailsModal } from "./CardDetailsModal";
import { CardNerdOutModal } from "./CardNerdOutModal";
import { toast } from "sonner";
import { getIssuerBrand, getHeroFeature, getFeeStyle } from "@/lib/issuerBranding";
import { useEligibilityScore } from "@/hooks/useEligibilityScore";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";

interface CardTileProps {
  card: CreditCard;
}

export const CardTile = ({ card }: CardTileProps) => {
  const navigate = useNavigate();
  const { addCard, removeCard, isSelected, selectedCards } = useCompare();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [nerdOutOpen, setNerdOutOpen] = useState(false);
  
  const issuerBrand = getIssuerBrand(card.issuer);
  const heroFeature = getHeroFeature(card);
  const feeStyle = getFeeStyle(card.annual_fee);
  const { data: eligibility } = useEligibilityScore(card.card_id);
  const viewTracked = useRef(false);

  // Track card view once per mount
  useEffect(() => {
    if (viewTracked.current) return;
    
    const trackView = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("card_views").insert({
          user_id: user.id,
          card_id: card.card_id,
          source: window.location.pathname.includes('recs') ? 'recommendations' : 'explore',
        });
        viewTracked.current = true;
      }
    };
    trackView();
  }, [card.card_id]);

  const getEligibilityBadge = () => {
    if (!eligibility) return null;
    if (eligibility.overall >= 80) return { label: "Excellent Match", color: "bg-green-500/10 text-green-700 border-green-500/20" };
    if (eligibility.overall >= 60) return { label: "Good Match", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" };
    if (eligibility.overall >= 40) return { label: "Fair Match", color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" };
    return { label: "Check Eligibility", color: "bg-gray-500/10 text-gray-700 border-gray-500/20" };
  };

  const eligibilityBadge = getEligibilityBadge();

  const handleCompareToggle = (checked: boolean) => {
    if (checked) {
      if (selectedCards.length >= 3) {
        toast.error("You can compare up to 3 cards at a time");
        return;
      }
      addCard(card);
      
      // Enhanced toast with action when 2+ cards selected
      if (selectedCards.length >= 1) {
        toast.success(`${card.name} added to comparison`, {
          description: `${selectedCards.length + 1} cards ready to compare`,
          action: {
            label: "Compare Now →",
            onClick: () => {
              window.dispatchEvent(new CustomEvent('openCompareDrawer'));
            }
          },
          duration: 5000
        });
      } else {
        toast.success(`${card.name} added to comparison`);
      }
    } else {
      removeCard(card.id);
      toast.success(`${card.name} removed from comparison`);
    }
  };

  return (
    <>
      <div 
        className="group glass-surface glass-highlight rounded-card border hover:shadow-glass-elevated transition-all duration-220 p-6 flex flex-col gloss-band hover:-translate-y-1.5 relative overflow-hidden"
        style={{ 
          borderColor: `hsl(${issuerBrand.color} / 0.2)`,
          background: `linear-gradient(135deg, hsl(${issuerBrand.lightBg} / 0.3) 0%, transparent 50%)`
        }}
      >
        {/* Dedicated Badge Row */}
        <div className="flex items-start justify-between mb-4 min-h-[2rem] gap-2">
          {/* Left: Eligibility Badge */}
          {eligibilityBadge && (
            <div 
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${eligibilityBadge.color} border`}
            >
              {eligibilityBadge.label}
            </div>
          )}

          {/* Right: Hero Feature Badge */}
          {heroFeature && (
            <div 
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ml-auto"
              style={{ 
                backgroundColor: `hsl(${issuerBrand.color} / 0.1)`,
                color: `hsl(${issuerBrand.color})`,
                border: `1px solid hsl(${issuerBrand.color} / 0.2)`
              }}
            >
              {heroFeature.icon} {heroFeature.label}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-heading font-bold text-ink mb-1 card-emboss-title">
            {card.name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ 
                backgroundColor: `hsl(${issuerBrand.lightBg})`,
                color: `hsl(${issuerBrand.color})`,
                borderColor: `hsl(${issuerBrand.color} / 0.2)`
              }}
            >
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
          <Badge 
            variant={feeStyle.variant}
            className={`text-sm font-bold tabular-nums card-emboss-badge ${feeStyle.className}`}
          >
            {feeStyle.label}
          </Badge>
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
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDetailsOpen(true)}
                className="text-sm font-body"
              >
                details
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setNerdOutOpen(true)}
                className="text-sm font-body"
              >
                🤓 nerd out
              </Button>
            </div>
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
      
      <CardNerdOutModal 
        card={card}
        open={nerdOutOpen}
        onOpenChange={setNerdOutOpen}
      />
    </>
  );
};
