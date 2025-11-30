import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plane, ShoppingBag, Utensils, Sparkles, Globe, CreditCard } from "lucide-react";

interface GoalQuestionModalProps {
  open: boolean;
  goalId: string;
  goalTitle: string;
  defaultSpend: number;
  loading?: boolean;
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
  loading = false,
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
    
    if (total === 0) {
      console.error('[GoalQuestionModal] Invalid spend split - total is 0');
      return;
    }
    
    const normalizedSplit = Object.fromEntries(
      Object.entries(spendSplit).map(([k, v]) => [k, (v / total) * 100])
    );

    console.log('[GoalQuestionModal] Spend split:', { raw: spendSplit, normalized: normalizedSplit, total });

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
              {/* Mobile: Compact with icon */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm">Travel spend</Label>
                    <div className="flex items-center gap-2 mt-1">
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
                      <span className="text-xs font-medium w-10 text-right">
                        {additionalData.travelSpend || 25}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: Full version */}
              <div className="hidden sm:block">
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

              {/* Mobile: Compact intl travel */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <Label className="text-sm">International travel?</Label>
                    <RadioGroup
                      value={additionalData.intlTravel || "no"}
                      onValueChange={(v) =>
                        setAdditionalData({ ...additionalData, intlTravel: v })
                      }
                      className="mt-1 flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="intl-yes-mobile" />
                        <Label htmlFor="intl-yes-mobile" className="text-sm font-normal cursor-pointer">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="intl-no-mobile" />
                        <Label htmlFor="intl-no-mobile" className="text-sm font-normal cursor-pointer">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Desktop: Full intl travel */}
              <div className="hidden sm:block">
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

              {/* Mobile: Compact monthly spend */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm">Monthly spend</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Slider
                        value={[monthlySpend]}
                        onValueChange={(v) => setMonthlySpend(v[0])}
                        min={10000}
                        max={200000}
                        step={5000}
                        className="flex-1"
                      />
                      <span className="text-xs font-medium w-16 text-right">
                        ₹{(monthlySpend / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: Full monthly spend */}
              <div className="hidden sm:block">
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
              {/* Mobile: Compact */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm">Shopping spend</Label>
                    <div className="flex items-center gap-2 mt-1">
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
                      <span className="text-xs font-medium w-10 text-right">
                        {additionalData.onlineSpend || 40}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: Full */}
              <div className="hidden sm:block">
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

              {/* Mobile: Compact rewards */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <Label className="text-sm">Reward type</Label>
                    <RadioGroup
                      value={additionalData.rewardType || "cashback"}
                      onValueChange={(v) =>
                        setAdditionalData({ ...additionalData, rewardType: v })
                      }
                      className="mt-1 flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cashback" id="cashback-mobile" />
                        <Label htmlFor="cashback-mobile" className="text-sm font-normal cursor-pointer">
                          Cashback
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="points" id="points-mobile" />
                        <Label htmlFor="points-mobile" className="text-sm font-normal cursor-pointer">
                          Points
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Desktop: Full rewards */}
              <div className="hidden sm:block">
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
              {/* Mobile: Compact */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3">
                  <Utensils className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm">Dining spend</Label>
                    <div className="flex items-center gap-2 mt-1">
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
                      <span className="text-xs font-medium w-10 text-right">
                        {additionalData.diningSpend || 35}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: Full */}
              <div className="hidden sm:block">
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

              {/* Mobile: Compact dining type */}
              <div className="sm:hidden">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <Label className="text-sm">Dining style</Label>
                    <RadioGroup
                      value={additionalData.diningType || "casual"}
                      onValueChange={(v) =>
                        setAdditionalData({ ...additionalData, diningType: v })
                      }
                      className="mt-1 flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fine" id="fine-mobile" />
                        <Label htmlFor="fine-mobile" className="text-sm font-normal cursor-pointer">
                          Fine
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="casual" id="casual-mobile" />
                        <Label htmlFor="casual-mobile" className="text-sm font-normal cursor-pointer">
                          Casual
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Desktop: Full dining type */}
              <div className="hidden sm:block">
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
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            <span className="hidden sm:inline">Tell us more about your {goalTitle.toLowerCase()}</span>
            <span className="sm:hidden">Customize goal</span>
          </DialogTitle>
          <DialogDescription className="hidden sm:block">
            Help us tailor recommendations to your actual spending patterns
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderQuestions()}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleComplete} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Recommendations"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
