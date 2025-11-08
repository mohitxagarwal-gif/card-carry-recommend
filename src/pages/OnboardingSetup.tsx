import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, CreditCard, XCircle } from "lucide-react";
import { toast } from "sonner";

interface CurrentCard {
  issuer: string;
  product: string;
  network: string;
}

const OnboardingSetup = () => {
  const navigate = useNavigate();
  const [currentCards, setCurrentCards] = useState<CurrentCard[]>([]);
  const [newCard, setNewCard] = useState<CurrentCard>({ issuer: "", product: "", network: "" });
  const [excludedIssuers, setExcludedIssuers] = useState<string[]>([]);
  const [feeTolerance, setFeeTolerance] = useState<string>("<=5k");
  
  const issuers = ["HDFC", "SBI", "ICICI", "Axis", "American Express", "Citi", "HSBC", "Standard Chartered", "Kotak", "IndusInd"];
  const networks = ["Visa", "Mastercard", "RuPay", "American Express"];

  useEffect(() => {
    const saved = localStorage.getItem("onboarding_setup");
    if (saved) {
      const data = JSON.parse(saved);
      setCurrentCards(data.currentCards || []);
      setExcludedIssuers(data.excludedIssuers || []);
      setFeeTolerance(data.feeTolerance || "<=5k");
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem("onboarding_setup", JSON.stringify({
      currentCards,
      excludedIssuers,
      feeTolerance
    }));
  };

  const handleAddCard = () => {
    if (newCard.issuer && newCard.product) {
      setCurrentCards([...currentCards, newCard]);
      setNewCard({ issuer: "", product: "", network: "" });
    }
  };

  const handleRemoveCard = (index: number) => {
    setCurrentCards(currentCards.filter((_, i) => i !== index));
  };

  const toggleIssuerExclusion = (issuer: string) => {
    if (excludedIssuers.includes(issuer)) {
      setExcludedIssuers(excludedIssuers.filter(i => i !== issuer));
    } else {
      setExcludedIssuers([...excludedIssuers, issuer]);
    }
  };

  const handleNext = () => {
    saveProgress();
    navigate("/onboarding/spending");
  };

  const handleSkip = () => {
    saveProgress();
    navigate("/onboarding/spending");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Your Current Cards & Preferences</CardTitle>
          <CardDescription>
            Help us understand your existing setup to provide better recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Current Credit Cards (Optional)</Label>
              <span className="text-sm text-muted-foreground">{currentCards.length} cards</span>
            </div>
            
            {currentCards.map((card, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                <CreditCard className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{card.product}</p>
                  <p className="text-sm text-muted-foreground">{card.issuer} • {card.network}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveCard(index)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Issuer"
                value={newCard.issuer}
                onChange={(e) => setNewCard({ ...newCard, issuer: e.target.value })}
                list="issuers"
              />
              <datalist id="issuers">
                {issuers.map(i => <option key={i} value={i} />)}
              </datalist>
              
              <Input
                placeholder="Product Name"
                value={newCard.product}
                onChange={(e) => setNewCard({ ...newCard, product: e.target.value })}
              />
              
              <Input
                placeholder="Network"
                value={newCard.network}
                onChange={(e) => setNewCard({ ...newCard, network: e.target.value })}
                list="networks"
              />
              <datalist id="networks">
                {networks.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            
            <Button onClick={handleAddCard} variant="outline" className="w-full">
              Add Card
            </Button>
          </div>

          {/* Fee Tolerance */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Annual Fee Tolerance</Label>
            <RadioGroup value={feeTolerance} onValueChange={setFeeTolerance}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zero" id="zero" />
                <Label htmlFor="zero">Zero fee only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="<=1k" id="1k" />
                <Label htmlFor="1k">Up to ₹1,000</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="<=5k" id="5k" />
                <Label htmlFor="5k">Up to ₹5,000</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any_2x_roi" id="any" />
                <Label htmlFor="any">Any fee if 2x ROI possible</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Excluded Issuers */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Banks to Exclude (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              {issuers.map((issuer) => (
                <div key={issuer} className="flex items-center space-x-2">
                  <Checkbox
                    id={issuer}
                    checked={excludedIssuers.includes(issuer)}
                    onCheckedChange={() => toggleIssuerExclusion(issuer)}
                  />
                  <Label htmlFor={issuer}>{issuer}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => navigate("/onboarding/basics")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <Button onClick={handleNext}>
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

export default OnboardingSetup;
