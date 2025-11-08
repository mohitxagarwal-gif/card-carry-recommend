import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const OnboardingTravel = () => {
  const navigate = useNavigate();
  const [domesticTrips, setDomesticTrips] = useState(4);
  const [internationalTrips, setInternationalTrips] = useState(1);
  const [loungeNeed, setLoungeNeed] = useState<string>("nice");
  const [homeAirports, setHomeAirports] = useState<string[]>([]);
  const [rewardPreference, setRewardPreference] = useState<string>("either");

  const airports = [
    { code: "BLR", city: "Bangalore" },
    { code: "DEL", city: "Delhi" },
    { code: "BOM", city: "Mumbai" },
    { code: "MAA", city: "Chennai" },
    { code: "HYD", city: "Hyderabad" },
    { code: "CCU", city: "Kolkata" },
    { code: "PNQ", city: "Pune" },
    { code: "AMD", city: "Ahmedabad" },
    { code: "COK", city: "Kochi" },
    { code: "GOI", city: "Goa" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("onboarding_travel");
    if (saved) {
      const data = JSON.parse(saved);
      setDomesticTrips(data.domesticTrips || 4);
      setInternationalTrips(data.internationalTrips || 1);
      setLoungeNeed(data.loungeNeed || "nice");
      setHomeAirports(data.homeAirports || []);
      setRewardPreference(data.rewardPreference || "either");
    }
  }, []);

  const saveProgress = () => {
    localStorage.setItem("onboarding_travel", JSON.stringify({
      domesticTrips,
      internationalTrips,
      loungeNeed,
      homeAirports,
      rewardPreference
    }));
  };

  const toggleAirport = (code: string) => {
    if (homeAirports.includes(code)) {
      setHomeAirports(homeAirports.filter(a => a !== code));
    } else {
      setHomeAirports([...homeAirports, code]);
    }
  };

  const handleNext = () => {
    saveProgress();
    navigate("/onboarding/recap");
  };

  const handleSkip = () => {
    saveProgress();
    navigate("/onboarding/recap");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Travel & Rewards Preferences</CardTitle>
          <CardDescription>
            Help us find cards with the right travel benefits for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Domestic Trips */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Domestic Trips per Year</Label>
              <span className="text-lg font-bold text-primary">{domesticTrips}</span>
            </div>
            <Slider
              value={[domesticTrips]}
              onValueChange={([val]) => setDomesticTrips(val)}
              min={0}
              max={24}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>None</span>
              <span>2/month</span>
            </div>
          </div>

          {/* International Trips */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">International Trips per Year</Label>
              <span className="text-lg font-bold text-primary">{internationalTrips}</span>
            </div>
            <Slider
              value={[internationalTrips]}
              onValueChange={([val]) => setInternationalTrips(val)}
              min={0}
              max={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>None</span>
              <span>Monthly</span>
            </div>
          </div>

          {/* Lounge Access */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Airport Lounge Importance</Label>
            <RadioGroup value={loungeNeed} onValueChange={setLoungeNeed}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">Not important</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nice" id="nice" />
                <Label htmlFor="nice">Nice to have</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="must" id="must" />
                <Label htmlFor="must">Must have</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Home Airports */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Home Airports (Optional)
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                Select up to 2
              </span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {airports.map(({ code, city }) => (
                <Badge
                  key={code}
                  variant={homeAirports.includes(code) ? "default" : "outline"}
                  className="cursor-pointer justify-start gap-2 py-2"
                  onClick={() => homeAirports.length < 2 || homeAirports.includes(code) ? toggleAirport(code) : null}
                >
                  <Plane className="w-3 h-3" />
                  <span className="font-mono text-xs">{code}</span>
                  <span className="text-xs">{city}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Reward Preference */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Reward Type Preference</Label>
            <RadioGroup value={rewardPreference} onValueChange={setRewardPreference}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cashback" id="cashback" />
                <Label htmlFor="cashback">Cashback (simple, direct value)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="points" id="points" />
                <Label htmlFor="points">Points/Miles (travel rewards)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="either" id="either" />
                <Label htmlFor="either">Either (best value)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => navigate("/onboarding/spending")}>
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

export default OnboardingTravel;
