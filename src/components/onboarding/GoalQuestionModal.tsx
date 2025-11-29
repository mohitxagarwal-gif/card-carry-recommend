import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface GoalQuestionModalProps {
  open: boolean;
  goalId: string;
  goalTitle: string;
  defaultSpend: number;
  onComplete: (data: {
    monthlySpend: number;
    spendSplit: Record<string, number>;
    additionalData: Record<string, any>;
  }) => void;
  onCancel: () => void;
}

export function GoalQuestionModal({
  open,
  goalId,
  goalTitle,
  defaultSpend,
  onComplete,
  onCancel,
}: GoalQuestionModalProps) {
  const [step, setStep] = useState(1);
  const [monthlySpend, setMonthlySpend] = useState(defaultSpend);
  const [additionalData, setAdditionalData] = useState<Record<string, any>>({});

  const handleComplete = () => {
    let spendSplit: Record<string, number> = {};

    // Build spend split based on goal and user inputs
    if (goalId === "travel_maximizer") {
      const travelSpend = additionalData.travelSpend || 25;
      const intlTravel = additionalData.intlTravel === "yes";
      
      spendSplit = {
        travel: travelSpend,
        dining: intlTravel ? 15 : 20,
        online: 20,
        groceries: 15,
        fuel: 10,
        forex: intlTravel ? 10 : 0,
        other: intlTravel ? 5 : 20,
      };
    } else if (goalId === "shopping_optimizer") {
      const onlineSpend = additionalData.onlineSpend || 40;
      
      spendSplit = {
        online: onlineSpend,
        groceries: 20,
        dining: 15,
        entertainment: 10,
        fuel: 10,
        other: 5,
      };
    } else if (goalId === "dining_rewards") {
      const diningSpend = additionalData.diningSpend || 35;
      const fineDining = additionalData.diningType === "fine";
      
      spendSplit = {
        dining: diningSpend,
        entertainment: 20,
        online: 15,
        groceries: 15,
        fuel: 10,
        other: fineDining ? 5 : 5,
      };
    } else if (goalId === "balanced_rewards") {
      // Use even distribution
      spendSplit = {
        online: 20,
        dining: 15,
        groceries: 20,
        travel: 10,
        fuel: 10,
        entertainment: 10,
        other: 15,
      };
    }

    // Normalize spend split to ensure it sums to 100
    const total = Object.values(spendSplit).reduce((sum, val) => sum + val, 0);
    const normalizedSplit = Object.fromEntries(
      Object.entries(spendSplit).map(([k, v]) => [k, v / total])
    );

    onComplete({
      monthlySpend,
      spendSplit: normalizedSplit,
      additionalData,
    });
  };

  const renderQuestions = () => {
    if (goalId === "travel_maximizer") {
      return (
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Monthly spend on travel (flights, hotels, etc.)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[additionalData.travelSpend || 25]}
                    onValueChange={(v) =>
                      setAdditionalData({ ...additionalData, travelSpend: v[0] })
                    }
                    min={5}
                    max={60}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">
                    {additionalData.travelSpend || 25}%
                  </span>
                </div>
              </div>

              <div>
                <Label>Do you travel internationally?</Label>
                <RadioGroup
                  value={additionalData.intlTravel || "no"}
                  onValueChange={(v) =>
                    setAdditionalData({ ...additionalData, intlTravel: v })
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="intl-yes" />
                    <Label htmlFor="intl-yes" className="font-normal cursor-pointer">
                      Yes, regularly
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="intl-no" />
                    <Label htmlFor="intl-no" className="font-normal cursor-pointer">
                      No or rarely
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Your approximate monthly spending</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[monthlySpend]}
                    onValueChange={(v) => setMonthlySpend(v[0])}
                    min={10000}
                    max={200000}
                    step={5000}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-24">
                    ₹{monthlySpend.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (goalId === "shopping_optimizer") {
      return (
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Monthly spend on online shopping</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[additionalData.onlineSpend || 40]}
                    onValueChange={(v) =>
                      setAdditionalData({ ...additionalData, onlineSpend: v[0] })
                    }
                    min={10}
                    max={70}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">
                    {additionalData.onlineSpend || 40}%
                  </span>
                </div>
              </div>

              <div>
                <Label>Preferred reward type</Label>
                <RadioGroup
                  value={additionalData.rewardType || "cashback"}
                  onValueChange={(v) =>
                    setAdditionalData({ ...additionalData, rewardType: v })
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cashback" id="cashback" />
                    <Label htmlFor="cashback" className="font-normal cursor-pointer">
                      Cashback
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="points" id="points" />
                    <Label htmlFor="points" className="font-normal cursor-pointer">
                      Reward Points
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Your approximate monthly spending</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[monthlySpend]}
                    onValueChange={(v) => setMonthlySpend(v[0])}
                    min={10000}
                    max={200000}
                    step={5000}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-24">
                    ₹{monthlySpend.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (goalId === "dining_rewards") {
      return (
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Monthly spend on dining & restaurants</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[additionalData.diningSpend || 35]}
                    onValueChange={(v) =>
                      setAdditionalData({ ...additionalData, diningSpend: v[0] })
                    }
                    min={10}
                    max={60}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">
                    {additionalData.diningSpend || 35}%
                  </span>
                </div>
              </div>

              <div>
                <Label>Dining preference</Label>
                <RadioGroup
                  value={additionalData.diningType || "casual"}
                  onValueChange={(v) =>
                    setAdditionalData({ ...additionalData, diningType: v })
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fine" id="fine" />
                    <Label htmlFor="fine" className="font-normal cursor-pointer">
                      Fine dining / Premium restaurants
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="casual" id="casual" />
                    <Label htmlFor="casual" className="font-normal cursor-pointer">
                      Casual dining / QSR
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Your approximate monthly spending</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[monthlySpend]}
                    onValueChange={(v) => setMonthlySpend(v[0])}
                    min={10000}
                    max={200000}
                    step={5000}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-24">
                    ₹{monthlySpend.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (goalId === "balanced_rewards") {
      return (
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Your approximate monthly spending</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[monthlySpend]}
                    onValueChange={(v) => setMonthlySpend(v[0])}
                    min={10000}
                    max={200000}
                    step={5000}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-24">
                    ₹{monthlySpend.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                We'll recommend well-rounded cards that perform across all categories.
              </p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tell us more about your {goalTitle.toLowerCase()}</DialogTitle>
          <DialogDescription>
            Help us tailor recommendations to your actual spending patterns
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderQuestions()}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleComplete}>
            Generate Recommendations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
