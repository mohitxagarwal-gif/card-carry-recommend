import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface QuickSpendingHintsProps {
  monthlySpend: number;
  onMonthlySpendChange: (value: number) => void;
  topCategories: string[];
  onTopCategoriesChange: (categories: string[]) => void;
  brands: string[];
  onBrandsChange: (brands: string[]) => void;
}

const CATEGORIES = [
  "Online Shopping",
  "Dining",
  "Travel",
  "Groceries",
  "Fuel",
  "Bills & Utilities",
  "Entertainment",
];

const BRANDS = [
  "Amazon",
  "Swiggy",
  "Zomato",
  "MakeMyTrip",
  "BookMyShow",
  "Flipkart",
  "BigBasket",
  "Uber",
];

export function QuickSpendingHints({
  monthlySpend,
  onMonthlySpendChange,
  topCategories,
  onTopCategoriesChange,
  brands,
  onBrandsChange,
}: QuickSpendingHintsProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleCategory = (category: string) => {
    if (topCategories.includes(category)) {
      onTopCategoriesChange(topCategories.filter(c => c !== category));
    } else if (topCategories.length < 3) {
      onTopCategoriesChange([...topCategories, category]);
    }
  };

  const toggleBrand = (brand: string) => {
    if (brands.includes(brand)) {
      onBrandsChange(brands.filter(b => b !== brand));
    } else {
      onBrandsChange([...brands, brand]);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <button
        type="button"
        className="w-full flex items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="space-y-1">
          <Label className="text-sm font-medium cursor-pointer">
            Add spending hints (optional)
          </Label>
          <p className="text-xs text-muted-foreground">
            {expanded ? "Helps us find better matches" : "Click to expand - improves recommendations"}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-6 pt-2">
          {/* Monthly Spend */}
          <div className="space-y-3">
            <Label className="text-sm">
              Estimated monthly spend: ₹{monthlySpend.toLocaleString('en-IN')}
            </Label>
            <Slider
              value={[monthlySpend]}
              onValueChange={(values) => onMonthlySpendChange(values[0])}
              min={10000}
              max={500000}
              step={10000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹10k</span>
              <span>₹5L</span>
            </div>
          </div>

          {/* Top Categories */}
          <div className="space-y-2">
            <Label className="text-sm">
              What do you spend most on? (Pick up to 3)
            </Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant={topCategories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {topCategories.length}/3 selected
            </p>
          </div>

          {/* Favorite Brands */}
          <div className="space-y-2">
            <Label className="text-sm">
              Any favorite brands? (optional)
            </Label>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((brand) => (
                <Badge
                  key={brand}
                  variant={brands.includes(brand) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleBrand(brand)}
                >
                  {brand}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
