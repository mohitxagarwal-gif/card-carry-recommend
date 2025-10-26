import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface EligibilityIndicatorProps {
  userIncome?: string;
  cardRequirement?: number;
}

export const EligibilityIndicator = ({ userIncome, cardRequirement }: EligibilityIndicatorProps) => {
  // Heuristic: estimate eligibility based on income bands
  const getEligibilityLevel = (): { level: 'high' | 'medium' | 'low', color: string } => {
    if (!userIncome || !cardRequirement) {
      return { level: 'medium', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' };
    }

    // Parse income band (e.g., "5L-10L" -> 750000 average)
    const incomeMap: Record<string, number> = {
      "Below 3L": 250000,
      "3L-5L": 400000,
      "5L-10L": 750000,
      "10L-20L": 1500000,
      "20L-50L": 3500000,
      "Above 50L": 7500000,
    };

    const estimatedIncome = incomeMap[userIncome] || 750000;

    if (estimatedIncome >= cardRequirement * 1.5) {
      return { level: 'high', color: 'bg-green-500/10 text-green-700 border-green-500/20' };
    } else if (estimatedIncome >= cardRequirement) {
      return { level: 'medium', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' };
    } else {
      return { level: 'low', color: 'bg-red-500/10 text-red-700 border-red-500/20' };
    }
  };

  const { level, color } = getEligibilityLevel();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${color} gap-1`}>
            {level === 'high' && 'High Match'}
            {level === 'medium' && 'Good Match'}
            {level === 'low' && 'May Qualify'}
            <InfoIcon className="w-3 h-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Estimate based on your income. Verify with issuer.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
