import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RadioGridProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  name: string;
}

export const RadioGrid = ({ options, value, onValueChange, name }: RadioGridProps) => {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {options.map((option) => (
        <div key={option.value} className="relative">
          <RadioGroupItem
            value={option.value}
            id={`${name}-${option.value}`}
            className="peer sr-only"
          />
          <Label
            htmlFor={`${name}-${option.value}`}
            className="flex min-h-[56px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted bg-card hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all py-3 px-2"
          >
            <span className="text-sm font-medium text-center whitespace-normal break-words">{option.label}</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};
