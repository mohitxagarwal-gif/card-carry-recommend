import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CardTile } from "@/components/CardTile";
import { CompareDrawer } from "@/components/CompareDrawer";
import { CompareProvider } from "@/contexts/CompareContext";
import { MobileNudges } from "@/components/MobileNudges";
import { issuers, rewardTypes, perkCategories, networks, feeRanges, forexRanges } from "@/data/cardData";
import { useCards } from "@/hooks/useCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FilterIcon, XIcon, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const CardsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: creditCards = [], isLoading } = useCards();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedIssuers, setSelectedIssuers] = useState<string[]>(
    searchParams.get("issuer")?.split(",").filter(Boolean) || []
  );
  const [selectedFeeRange, setSelectedFeeRange] = useState(searchParams.get("fee") || "");
  const [selectedRewardTypes, setSelectedRewardTypes] = useState<string[]>(
    searchParams.get("rewards")?.split(",").filter(Boolean) || []
  );
  const [selectedPerks, setSelectedPerks] = useState<string[]>(
    searchParams.get("perks")?.split(",").filter(Boolean) || []
  );
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(
    searchParams.get("network")?.split(",").filter(Boolean) || []
  );
  const [selectedForexRange, setSelectedForexRange] = useState(searchParams.get("forex") || "");
  const [welcomeBonusOnly, setWelcomeBonusOnly] = useState(searchParams.get("bonus") === "true");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "");
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedIssuers.length) params.set("issuer", selectedIssuers.join(","));
    if (selectedFeeRange) params.set("fee", selectedFeeRange);
    if (selectedRewardTypes.length) params.set("rewards", selectedRewardTypes.join(","));
    if (selectedPerks.length) params.set("perks", selectedPerks.join(","));
    if (selectedNetworks.length) params.set("network", selectedNetworks.join(","));
    if (selectedForexRange) params.set("forex", selectedForexRange);
    if (welcomeBonusOnly) params.set("bonus", "true");
    if (sortBy) params.set("sort", sortBy);
    setSearchParams(params);
  }, [search, selectedIssuers, selectedFeeRange, selectedRewardTypes, selectedPerks, selectedNetworks, selectedForexRange, welcomeBonusOnly, sortBy, setSearchParams]);

  useEffect(() => {
    const hasFilters = Boolean(search || selectedIssuers.length || selectedFeeRange || selectedRewardTypes.length || selectedPerks.length || selectedNetworks.length || selectedForexRange || welcomeBonusOnly);
    setHasAppliedFilters(hasFilters);
  }, [search, selectedIssuers, selectedFeeRange, selectedRewardTypes, selectedPerks, selectedNetworks, selectedForexRange, welcomeBonusOnly]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading cards...</p>
      </div>
    );
  }

  const filteredCards = useMemo(() => {
    let cards = creditCards.filter(card => card.is_active);

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      cards = cards.filter(card => 
        card.name.toLowerCase().includes(searchLower) ||
        card.issuer.toLowerCase().includes(searchLower)
      );
    }

    // Issuer
    if (selectedIssuers.length) {
      cards = cards.filter(card => selectedIssuers.includes(card.issuer));
    }

    // Fee range
    if (selectedFeeRange) {
      cards = cards.filter(card => {
        if (selectedFeeRange === "No fee") return card.annual_fee === 0;
        if (selectedFeeRange === "≤₹1,000") return card.annual_fee > 0 && card.annual_fee <= 1000;
        if (selectedFeeRange === "₹1,000–₹3,000") return card.annual_fee > 1000 && card.annual_fee <= 3000;
        if (selectedFeeRange === ">₹3,000") return card.annual_fee > 3000;
        return true;
      });
    }

    // Reward types
    if (selectedRewardTypes.length) {
      cards = cards.filter(card => 
        card.reward_type.some(type => selectedRewardTypes.includes(type))
      );
    }

    // Perks
    if (selectedPerks.length) {
      cards = cards.filter(card => 
        card.key_perks.some(perk => 
          selectedPerks.some(selectedPerk => 
            perk.toLowerCase().includes(selectedPerk.toLowerCase())
          )
        )
      );
    }

    // Networks
    if (selectedNetworks.length) {
      cards = cards.filter(card => selectedNetworks.includes(card.network));
    }

    // Forex range
    if (selectedForexRange) {
      cards = cards.filter(card => {
        const forex = card.forex_markup_pct;
        if (selectedForexRange === "0%") return forex === 0;
        if (selectedForexRange === "<2%") return forex > 0 && forex < 2;
        if (selectedForexRange === "2-3.5%") return forex >= 2 && forex <= 3.5;
        if (selectedForexRange === ">3.5%") return forex > 3.5;
        return true;
      });
    }

    // Welcome bonus
    if (welcomeBonusOnly) {
      cards = cards.filter(card => card.welcome_bonus && card.welcome_bonus !== "None");
    }

    // Sort
    cards.sort((a, b) => {
      if (sortBy === "popularity" || !sortBy) return b.popular_score - a.popular_score;
      if (sortBy === "welcome-bonus") return (b.welcome_bonus !== "None" ? 1 : 0) - (a.welcome_bonus !== "None" ? 1 : 0);
      if (sortBy === "fee-low") return a.annual_fee - b.annual_fee;
      if (sortBy === "fee-high") return b.annual_fee - a.annual_fee;
      if (sortBy === "lounge-access") return (b.lounge_access !== "No lounge access" ? 1 : 0) - (a.lounge_access !== "No lounge access" ? 1 : 0);
      return 0;
    });

    return cards;
  }, [search, selectedIssuers, selectedFeeRange, selectedRewardTypes, selectedPerks, selectedNetworks, selectedForexRange, welcomeBonusOnly, sortBy, creditCards]);

  const clearAllFilters = () => {
    setSearch("");
    setSelectedIssuers([]);
    setSelectedFeeRange("");
    setSelectedRewardTypes([]);
    setSelectedPerks([]);
    setSelectedNetworks([]);
    setSelectedForexRange("");
    setWelcomeBonusOnly(false);
    setSortBy("");
    setSearchParams(new URLSearchParams());
  };

  const toggleArrayFilter = (value: string, array: string[], setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  // Show nudge after filters applied
  useEffect(() => {
    const filterCount = selectedIssuers.length + selectedRewardTypes.length + selectedPerks.length + selectedNetworks.length;
    const hasFilters = filterCount >= 2 || search || selectedFeeRange || selectedForexRange;
    
    if (hasFilters && !hasAppliedFilters) {
      setHasAppliedFilters(true);
      const timer = setTimeout(() => {
        toast("Not sure what to choose?", {
          description: "See your top 3 in under 2 minutes",
          action: {
            label: "Start my match",
            onClick: () => navigate("/auth")
          },
          duration: 5000
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedIssuers, selectedRewardTypes, selectedPerks, selectedNetworks, search, selectedFeeRange, selectedForexRange, hasAppliedFilters, navigate]);

  // Helper function to get active filters
  const getActiveFilters = () => {
    const filters: { label: string; onRemove: () => void; key: string }[] = [];
    
    if (search) {
      filters.push({ label: `"${search}"`, onRemove: () => setSearch(""), key: "search" });
    }
    
    selectedIssuers.forEach(issuer => {
      filters.push({ 
        label: issuer, 
        onRemove: () => setSelectedIssuers(prev => prev.filter(i => i !== issuer)),
        key: `issuer-${issuer}`
      });
    });
    
    if (selectedFeeRange) {
      filters.push({ 
        label: selectedFeeRange.replace("-", " - "), 
        onRemove: () => setSelectedFeeRange(null),
        key: "fee"
      });
    }
    
    selectedRewardTypes.forEach(reward => {
      filters.push({ 
        label: reward, 
        onRemove: () => setSelectedRewardTypes(prev => prev.filter(r => r !== reward)),
        key: `reward-${reward}`
      });
    });
    
    selectedPerks.forEach(perk => {
      filters.push({ 
        label: perk, 
        onRemove: () => setSelectedPerks(prev => prev.filter(p => p !== perk)),
        key: `perk-${perk}`
      });
    });
    
    selectedNetworks.forEach(network => {
      filters.push({ 
        label: network, 
        onRemove: () => setSelectedNetworks(prev => prev.filter(n => n !== network)),
        key: `network-${network}`
      });
    });
    
    if (selectedForexRange) {
      filters.push({ 
        label: `Forex ${selectedForexRange}`, 
        onRemove: () => setSelectedForexRange(null),
        key: "forex"
      });
    }
    
    if (welcomeBonusOnly) {
      filters.push({ 
        label: "Welcome Bonus", 
        onRemove: () => setWelcomeBonusOnly(false),
        key: "welcome"
      });
    }
    
    return filters;
  };

  const activeFilters = getActiveFilters();

  const FilterContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
        <label className="text-sm font-sans font-medium text-foreground mb-2 block">Search</label>
        <Input
          placeholder="Card name or issuer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="font-sans"
        />
      </div>

      <div>
        <label className="text-sm font-sans font-medium text-foreground mb-2 block">Issuer</label>
        <div className="flex flex-wrap gap-2">
          {["HDFC", "SBI", "ICICI", "Axis", "Kotak", "AMEX", "Standard Chartered", "Yes Bank", "IndusInd", "AU Bank", "IDFC First", "RBL"].map((issuer) => (
            <Badge
              key={issuer}
              variant={selectedIssuers.includes(issuer) ? "default" : "outline"}
              className="cursor-pointer font-sans"
              onClick={() => toggleArrayFilter(issuer, selectedIssuers, setSelectedIssuers)}
            >
              {issuer}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-sans font-medium text-foreground mb-2 block">Annual Fee</label>
        <div className="flex flex-wrap gap-2">
          {["Free", "₹500-2000", "₹2000-5000", "₹5000+"].map((range) => (
            <Badge
              key={range}
              variant={selectedFeeRange === range ? "default" : "outline"}
              className="cursor-pointer font-sans"
              onClick={() => setSelectedFeeRange(selectedFeeRange === range ? null : range)}
            >
              {range}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-sans font-medium text-foreground mb-2 block">Rewards</label>
        <div className="flex flex-wrap gap-2">
          {["Cashback", "Reward Points", "Miles", "Fuel", "Travel"].map((type) => (
            <Badge
              key={type}
              variant={selectedRewardTypes.includes(type) ? "default" : "outline"}
              className="cursor-pointer font-sans"
              onClick={() => toggleArrayFilter(type, selectedRewardTypes, setSelectedRewardTypes)}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-sans font-medium text-foreground mb-2 block">Perks</label>
        <div className="flex flex-wrap gap-2">
          {["Airport Lounge", "Golf", "Dining", "Movie", "Shopping"].map((perk) => (
            <Badge
              key={perk}
              variant={selectedPerks.includes(perk) ? "default" : "outline"}
              className="cursor-pointer font-sans"
              onClick={() => toggleArrayFilter(perk, selectedPerks, setSelectedPerks)}
            >
              {perk}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-sans font-medium text-foreground mb-2 block">Network</label>
        <div className="flex flex-wrap gap-2">
          {["Visa", "Mastercard", "RuPay", "American Express"].map((network) => (
            <Badge
              key={network}
              variant={selectedNetworks.includes(network) ? "default" : "outline"}
              className="cursor-pointer font-sans"
              onClick={() => toggleArrayFilter(network, selectedNetworks, setSelectedNetworks)}
            >
              {network}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-sans font-medium text-foreground mb-2 block">Forex Markup</label>
        <div className="flex flex-wrap gap-2">
          {["0%", "1-2%", "2-3%", "3%+"].map((range) => (
            <Badge
              key={range}
              variant={selectedForexRange === range ? "default" : "outline"}
              className="cursor-pointer font-sans"
              onClick={() => setSelectedForexRange(selectedForexRange === range ? null : range)}
            >
              {range}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-sans font-medium text-foreground mb-2 block">Welcome Bonus</label>
        <Badge
          variant={welcomeBonusOnly ? "default" : "outline"}
          className="cursor-pointer font-sans"
          onClick={() => setWelcomeBonusOnly(!welcomeBonusOnly)}
        >
          Has Welcome Bonus
        </Badge>
      </div>

      <div className="flex items-end">
        <Button
          variant="outline"
          onClick={clearAllFilters}
          className="w-full font-sans"
        >
          <XIcon className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>
    </div>
  );

  return (
    <CompareProvider>
      <div className="min-h-screen bg-background font-sans">
        <Header />
        
        <main className="py-12 lg:py-16">
          <div className="container mx-auto px-6 lg:px-12">
            {/* Header */}
            <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-playfair italic font-medium text-foreground mb-2">
                  Explore & Compare Credit Cards (India)
                </h1>
                <p className="text-base lg:text-lg font-sans text-muted-foreground">
                  Browse all active cards. Filter by fees, perks, and networks. Compare side-by-side.
                </p>
              </div>
              <Button
                onClick={() => navigate("/auth")}
                className="shrink-0 font-sans"
              >
                Get personalized picks →
              </Button>
            </div>

            {/* Collapsible Filters Banner */}
            <div className="mb-8 bg-card/30 rounded-2xl border border-border/30 overflow-hidden">
              <Collapsible open={isFiltersExpanded} onOpenChange={setIsFiltersExpanded}>
                {/* Always Visible Top Bar */}
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    {/* Search Input */}
                    <div className="flex-1 w-full md:w-auto">
                      <Input
                        placeholder="Search cards..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="font-sans"
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full md:w-[180px] font-sans">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Popularity</SelectItem>
                        <SelectItem value="welcome-bonus">Welcome Bonus</SelectItem>
                        <SelectItem value="fee-low">Fee: Low to High</SelectItem>
                        <SelectItem value="fee-high">Fee: High to Low</SelectItem>
                        <SelectItem value="lounge-access">Lounge Access</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Expand/Collapse Button */}
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="default" className="font-sans w-full md:w-auto">
                        <FilterIcon className="w-4 h-4 mr-2" />
                        {isFiltersExpanded ? "Hide Filters" : "Show Filters"}
                        {isFiltersExpanded ? (
                          <ChevronUp className="w-4 h-4 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-2" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  {/* Active Filter Badges */}
                  {activeFilters.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-sans text-muted-foreground">
                        Active filters:
                      </span>
                      {activeFilters.map((filter) => (
                        <Badge
                          key={filter.key}
                          variant="secondary"
                          className="font-sans cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={filter.onRemove}
                        >
                          {filter.label}
                          <XIcon className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="font-sans text-xs h-7"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expandable Filter Content */}
                <CollapsibleContent className="animate-accordion-down">
                  <div className="px-4 md:px-6 pb-6 pt-2 border-t border-border/30">
                    <FilterContent />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Card Grid */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-sans text-muted-foreground">
                    {filteredCards.length} {filteredCards.length === 1 ? "card" : "cards"} found
                  </p>
                </div>

                {filteredCards.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-lg font-sans text-muted-foreground mb-4">
                      No cards match your filters
                    </p>
                    <Button variant="outline" onClick={clearAllFilters} className="font-sans">
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCards.map(card => (
                      <CardTile key={card.id} card={card} />
                    ))}
                  </div>
                )}
              </div>

            {/* Footer Disclaimer */}
            <div className="mt-12 pt-8 border-t border-border/30">
              <p className="text-xs font-sans text-muted-foreground text-center">
                Information is educational. Always verify issuer T&Cs. Benefits and fees change.
              </p>
            </div>
          </div>
        </main>

        <Footer />
        <CompareDrawer />
        <MobileNudges />
      </div>
    </CompareProvider>
  );
};

export default CardsPage;
