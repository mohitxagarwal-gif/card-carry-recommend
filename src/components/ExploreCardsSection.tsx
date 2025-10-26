import { useState, useMemo } from "react";
import { creditCards, issuers, feeCategories, rewardTypes, perkCategories, networks } from "@/data/cardData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { CardTile } from "./CardTile";

const ExploreCardsSection = () => {
  const [selectedIssuer, setSelectedIssuer] = useState("All");
  const [selectedFee, setSelectedFee] = useState("All");
  const [selectedReward, setSelectedReward] = useState("All");
  const [selectedPerk, setSelectedPerk] = useState("All");
  const [selectedNetwork, setSelectedNetwork] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [showCount, setShowCount] = useState(6);

  const filteredCards = useMemo(() => {
    let filtered = creditCards.filter(card => {
      // Issuer filter
      if (selectedIssuer !== "All" && card.issuer !== selectedIssuer) return false;

      // Fee filter
      if (selectedFee !== "All") {
        if (selectedFee === "No Fee" && card.annualFee > 0) return false;
        if (selectedFee === "Low (< ₹1,000)" && card.annualFee >= 1000) return false;
        if (selectedFee === "Medium (₹1,000 - ₹5,000)" && (card.annualFee < 1000 || card.annualFee > 5000)) return false;
        if (selectedFee === "High (> ₹5,000)" && card.annualFee <= 5000) return false;
      }

      // Reward type filter
      if (selectedReward !== "All") {
        const rewardLower = card.rewardStructure.toLowerCase();
        if (selectedReward === "Cashback" && !rewardLower.includes("cashback")) return false;
        if (selectedReward === "Points" && !rewardLower.includes("points")) return false;
        if (selectedReward === "Miles" && !rewardLower.includes("miles")) return false;
      }

      // Perk filter
      if (selectedPerk !== "All") {
        const perkLower = selectedPerk.toLowerCase();
        const hasMatchingPerk = card.keyPerks.some(perk => perk.toLowerCase().includes(perkLower)) ||
                                card.categoryBadges.some(badge => badge.toLowerCase().includes(perkLower));
        if (!hasMatchingPerk) return false;
      }

      // Network filter
      if (selectedNetwork !== "All" && card.network !== selectedNetwork) return false;

      return true;
    });

    // Sorting
    if (sortBy === "popular") {
      // Keep original order (assumed to be popularity)
    } else if (sortBy === "fee-low") {
      filtered.sort((a, b) => a.annualFee - b.annualFee);
    } else if (sortBy === "welcome") {
      // Sort by welcome bonus (rough heuristic based on point values)
      filtered.sort((a, b) => {
        const getWelcomeValue = (bonus: string) => {
          const match = bonus.match(/(\d+,?\d*)/);
          return match ? parseInt(match[1].replace(/,/g, '')) : 0;
        };
        return getWelcomeValue(b.welcomeBonus) - getWelcomeValue(a.welcomeBonus);
      });
    }

    return filtered;
  }, [selectedIssuer, selectedFee, selectedReward, selectedPerk, selectedNetwork, sortBy]);

  const displayedCards = filteredCards.slice(0, showCount);

  return (
    <section id="explore-cards" className="container mx-auto px-6 lg:px-12 py-24 md:py-32 bg-card/30 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-playfair italic font-medium text-foreground text-center mb-12 leading-tight">
          explore credit cards
        </h2>

        {/* Filters */}
        <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-border/30 p-6 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <Select value={selectedIssuer} onValueChange={setSelectedIssuer}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Issuer" />
              </SelectTrigger>
              <SelectContent>
                {issuers.map(issuer => (
                  <SelectItem key={issuer} value={issuer}>{issuer}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFee} onValueChange={setSelectedFee}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Annual Fee" />
              </SelectTrigger>
              <SelectContent>
                {feeCategories.map(fee => (
                  <SelectItem key={fee} value={fee}>{fee}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedReward} onValueChange={setSelectedReward}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Reward Type" />
              </SelectTrigger>
              <SelectContent>
                {rewardTypes.map(reward => (
                  <SelectItem key={reward} value={reward}>{reward}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPerk} onValueChange={setSelectedPerk}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Perks" />
              </SelectTrigger>
              <SelectContent>
                {perkCategories.map(perk => (
                  <SelectItem key={perk} value={perk}>{perk}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Network" />
              </SelectTrigger>
              <SelectContent>
                {networks.map(network => (
                  <SelectItem key={network} value={network}>{network}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-sans text-muted-foreground">sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">most popular</SelectItem>
                <SelectItem value="welcome">best welcome bonus</SelectItem>
                <SelectItem value="fee-low">lowest fee</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm font-sans text-muted-foreground ml-auto">
              {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayedCards.map(card => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>

        {/* Load More */}
        {displayedCards.length < filteredCards.length && (
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowCount(prev => prev + 6)}
              className="font-sans"
            >
              load more cards
            </Button>
          </div>
        )}

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg font-sans text-muted-foreground">
              no cards match your filters. try adjusting your criteria.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExploreCardsSection;
