import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, TrendingUp, ExternalLink, Plus, Check } from "lucide-react";
import { useCards } from "@/hooks/useCards";
import { useShortlist } from "@/hooks/useShortlist";
import { useApplications } from "@/hooks/useApplications";
import { CardActionBar } from "@/components/CardActionBar";

interface RecommendationsGridProps {
  recommendedCards: any[];
  selectedCards: string[];
  onCardSelect: (cardId: string) => void;
  filterIssuer: string | null;
  sortBy: 'match' | 'savings' | 'fee';
  onFilterChange: (issuer: string | null) => void;
  onSortChange: (sort: 'match' | 'savings' | 'fee') => void;
}

export const RecommendationsGrid = ({
  recommendedCards,
  selectedCards,
  onCardSelect,
  filterIssuer,
  sortBy,
  onFilterChange,
  onSortChange
}: RecommendationsGridProps) => {
  const { data: allCards } = useCards();
  const { shortlist, addToShortlist, isInShortlist } = useShortlist();
  const { applications } = useApplications();

  // Get unique issuers
  const issuers = Array.from(new Set(recommendedCards.map(c => c.issuer))).filter(Boolean);

  // Filter and sort cards
  let displayCards = [...recommendedCards];

  if (filterIssuer) {
    displayCards = displayCards.filter(card => card.issuer === filterIssuer);
  }

  displayCards.sort((a, b) => {
    if (sortBy === 'match') {
      return (b.matchScore || 0) - (a.matchScore || 0);
    } else if (sortBy === 'savings') {
      const aSavings = extractSavings(a.estimatedSavings);
      const bSavings = extractSavings(b.estimatedSavings);
      return bSavings - aSavings;
    } else {
      const aFee = extractFee(a.name, allCards);
      const bFee = extractFee(b.name, allCards);
      return aFee - bFee;
    }
  });

  const getApplicationStatus = (cardName: string) => {
    const app = applications?.find(a => 
      allCards?.find(c => c.name === cardName && c.card_id === a.card_id)
    );
    return app?.status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Recommended Cards ({displayCards.length})
          </h2>
          <p className="text-sm text-muted-foreground font-sans mt-1">
            Based on your spending patterns and preferences
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filterIssuer || 'all'} onValueChange={(v) => onFilterChange(v === 'all' ? null : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Issuers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issuers</SelectItem>
              {issuers.map(issuer => (
                <SelectItem key={issuer} value={issuer}>{issuer}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v: any) => onSortChange(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="savings">Highest Savings</SelectItem>
              <SelectItem value="fee">Lowest Fee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCards.map((card, idx) => {
          const cardId = allCards?.find(c => c.name === card.name)?.card_id || card.name;
          const isSelected = selectedCards.includes(cardId);
          const isShortlisted = isInShortlist(cardId);
          const appStatus = getApplicationStatus(card.name);

          return (
            <Card
              key={idx}
              className={`relative transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="absolute top-4 right-4 z-10">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onCardSelect(cardId)}
                  className="bg-background"
                />
              </div>

              <CardContent className="pt-6 space-y-4">
                {/* Card Image */}
                {allCards?.find(c => c.name === card.name)?.image_url && (
                  <div className="flex justify-center mb-4">
                    <div className="relative w-20 h-[50px] rounded-lg overflow-hidden shadow-md border border-hairline">
                      <img 
                        src={allCards.find(c => c.name === card.name)?.image_url} 
                        alt={`${card.name} card`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {idx < 3 && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Star className="w-3 h-3 mr-1 fill-primary" />
                      Top {idx + 1} Match
                    </Badge>
                  )}
                  
                  <h3 className="text-lg font-heading font-bold text-foreground pr-8">
                    {card.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-sans">
                    {card.issuer}
                  </p>
                </div>

                {card.matchScore && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${card.matchScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {card.matchScore}%
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-sans">Est. Savings</span>
                    <span className="font-semibold text-green-600">
                      {card.estimatedSavings}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground font-sans">Why this card?</p>
                  <p className="text-xs text-muted-foreground font-sans line-clamp-2">
                    {card.reason}
                  </p>
                </div>

                {appStatus && (
                  <Badge variant="outline" className="w-full justify-center">
                    Status: {appStatus}
                  </Badge>
                )}

                <div className="flex gap-2">
                  <Button
                    variant={isShortlisted ? "secondary" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => addToShortlist(cardId)}
                    disabled={isShortlisted}
                  >
                    {isShortlisted ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Shortlisted
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Shortlist
                      </>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // Navigate to card details or application
                      window.open('#', '_blank');
                    }}
                  >
                    View Details
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {displayCards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground font-sans">
              No cards match your current filters. Try adjusting your selection.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const extractSavings = (savingsText: string): number => {
  const match = savingsText?.match(/₹([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, '')) : 0;
};

const extractFee = (cardName: string, allCards: any[]): number => {
  const card = allCards?.find(c => c.name === cardName);
  return card?.annual_fee || 0;
};
