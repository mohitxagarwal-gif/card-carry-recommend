import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface BrandSelectorProps {
  selected: Array<{ brand: string; category: string }>;
  onChange: (brands: Array<{ brand: string; category: string }>) => void;
}

const popularBrands = {
  dining: ["Swiggy", "Zomato", "Dominos", "Pizza Hut", "KFC", "McDonald's", "Starbucks", "Subway"],
  shopping: ["Amazon", "Flipkart", "Myntra", "Ajio", "Meesho", "Nykaa"],
  travel: ["MakeMyTrip", "Goibibo", "Booking.com", "Ola", "Uber", "Rapido"],
  entertainment: ["BookMyShow", "Netflix", "Amazon Prime", "Disney+ Hotstar", "Spotify"],
  groceries: ["BigBasket", "Blinkit", "Zepto", "Swiggy Instamart", "Dunzo"],
};

export function BrandSelector({ selected, onChange }: BrandSelectorProps) {
  const [customBrand, setCustomBrand] = useState("");

  const toggleBrand = (brand: string, category: string) => {
    const exists = selected.some(b => b.brand === brand);
    if (exists) {
      onChange(selected.filter(b => b.brand !== brand));
    } else {
      onChange([...selected, { brand, category }]);
    }
  };

  const addCustomBrand = () => {
    if (customBrand.trim()) {
      onChange([...selected, { brand: customBrand.trim(), category: "other" }]);
      setCustomBrand("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Selected Brands */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-secondary/20">
          {selected.map((item, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1">
              {item.brand}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => toggleBrand(item.brand, item.category)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Popular Brands by Category */}
      {Object.entries(popularBrands).map(([category, brands]) => (
        <div key={category} className="space-y-2">
          <p className="text-sm font-medium capitalize text-muted-foreground">{category}</p>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Badge
                key={brand}
                variant={selected.some(b => b.brand === brand) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleBrand(brand, category)}
              >
                {brand}
              </Badge>
            ))}
          </div>
        </div>
      ))}

      {/* Custom Brand Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add other brand..."
          value={customBrand}
          onChange={(e) => setCustomBrand(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addCustomBrand()}
        />
        <Button onClick={addCustomBrand} size="icon" variant="outline">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
