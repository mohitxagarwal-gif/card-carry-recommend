import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SpendingSliders } from "@/components/onboarding/SpendingSliders";
import { BrandSelector } from "@/components/onboarding/BrandSelector";

const OnboardingSpending = () => {
  const navigate = useNavigate();
  const [monthlySpend, setMonthlySpend] = useState(50000);
  const [spendSplit, setSpendSplit] = useState({
    online: 25,
    dining: 15,
    groceries: 15,
    travel: 10,
    fuel: 10,
    bills: 10,
    entertainment: 10,
    forex: 5,
  });
  const [brandAffinities, setBrandAffinities] = useState<Array<{ brand: string; category: string }>>([]);
  const [rentViaCard, setRentViaCard] = useState(false);
  const [upiCcShare, setUpiCcShare] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("onboarding_spending");
    if (saved) {
      const data = JSON.parse(saved);
      setMonthlySpend(data.monthlySpend || 50000);
      setSpendSplit(data.spendSplit || spendSplit);
      setBrandAffinities(data.brandAffinities || []);
      setRentViaCard(data.rentViaCard || false);
      setUpiCcShare(data.upiCcShare || 0);
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem("onboarding_spending", JSON.stringify({
      monthlySpend,
      spendSplit,
      brandAffinities,
      rentViaCard,
      upiCcShare
    }));
  };

  const handleNext = () => {
    saveProgress();
    navigate("/onboarding/travel");
  };

  const handleSkip = () => {
    saveProgress();
    navigate("/onboarding/travel");
  };

  const total = Object.values(spendSplit).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(total - 100) < 0.1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Your Spending Patterns</CardTitle>
          <CardDescription>
            Tell us how you typically spend each month for personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monthly Spend Estimate */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Estimated Monthly Spend</Label>
              <span className="text-lg font-bold text-primary">₹{monthlySpend.toLocaleString('en-IN')}</span>
            </div>
            <Slider
              value={[monthlySpend]}
              onValueChange={([val]) => setMonthlySpend(val)}
              min={10000}
              max={500000}
              step={5000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹10k</span>
              <span>₹500k</span>
            </div>
          </div>

          {/* Spending Split */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Category Breakdown</Label>
              <span className={`text-sm font-medium ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                Total: {total.toFixed(0)}%
              </span>
            </div>
            <SpendingSliders spendSplit={spendSplit} onChange={setSpendSplit} />
            {!isValid && (
              <p className="text-sm text-red-600">⚠️ Categories must add up to 100%</p>
            )}
          </div>

          {/* Brand Affinities */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Favorite Brands (Optional)</Label>
            <BrandSelector selected={brandAffinities} onChange={setBrandAffinities} />
          </div>

          {/* Rent & UPI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Pay Rent via Credit Card?</Label>
                <p className="text-sm text-muted-foreground">Apps like CRED, Paytm, etc.</p>
              </div>
              <Switch checked={rentViaCard} onCheckedChange={setRentViaCard} />
            </div>

            {rentViaCard && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label className="text-sm">% of spend via UPI on Credit Card</Label>
                <Slider
                  value={[upiCcShare]}
                  onValueChange={([val]) => setUpiCcShare(val)}
                  min={0}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">{upiCcShare}% of your spend</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => navigate("/onboarding/setup")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <Button onClick={handleNext} disabled={!isValid}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSpending;
