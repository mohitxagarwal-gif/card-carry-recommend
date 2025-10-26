import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  name: string;
}

export const SegmentedControl = ({ options, value, onValueChange, name }: SegmentedControlProps) => {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {options.map((option) => (
        <div key={option.value} className="relative">
          <RadioGroupItem
            value={option.value}
            id={`${name}-${option.value}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`${name}-${option.value}`}
            className="flex h-11 cursor-pointer items-center justify-center rounded-md border-2 border-muted bg-background px-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground transition-all"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
