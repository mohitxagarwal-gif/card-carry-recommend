import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ShoppingBag, UtensilsCrossed, ShoppingCart, Plane, Fuel, Receipt, Tv, Globe } from "lucide-react";

interface SpendSplit {
  online: number;
  dining: number;
  groceries: number;
  travel: number;
  fuel: number;
  bills: number;
  entertainment: number;
  forex: number;
}

interface SpendingSlidersProps {
  spendSplit: SpendSplit;
  onChange: (split: SpendSplit) => void;
}

const categories = [
  { key: "online", label: "Online Shopping", icon: ShoppingBag, color: "text-blue-600" },
  { key: "dining", label: "Dining", icon: UtensilsCrossed, color: "text-orange-600" },
  { key: "groceries", label: "Groceries", icon: ShoppingCart, color: "text-green-600" },
  { key: "travel", label: "Travel", icon: Plane, color: "text-purple-600" },
  { key: "fuel", label: "Fuel", icon: Fuel, color: "text-red-600" },
  { key: "bills", label: "Bills & Utilities", icon: Receipt, color: "text-yellow-600" },
  { key: "entertainment", label: "Entertainment", icon: Tv, color: "text-pink-600" },
  { key: "forex", label: "International/Forex", icon: Globe, color: "text-cyan-600" },
];

export function SpendingSliders({ spendSplit, onChange }: SpendingSlidersProps) {
  const handleChange = (category: string, value: number) => {
    const newSplit = { ...spendSplit, [category]: value } as SpendSplit;
    onChange(newSplit);
  };

  return (
    <div className="space-y-4">
      {categories.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <Label className="text-sm">{label}</Label>
            </div>
            <span className="text-sm font-semibold">{spendSplit[key].toFixed(0)}%</span>
          </div>
          <Slider
            value={[spendSplit[key]]}
            onValueChange={([val]) => handleChange(key, val)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}
