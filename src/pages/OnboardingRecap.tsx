import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, CheckCircle2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OnboardingRecap = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const basics = JSON.parse(localStorage.getItem("onboarding_basics") || "{}");
    const setup = JSON.parse(localStorage.getItem("onboarding_setup") || "{}");
    const spending = JSON.parse(localStorage.getItem("onboarding_spending") || "{}");
    const travel = JSON.parse(localStorage.getItem("onboarding_travel") || "{}");
    
    setData({ basics, setup, spending, travel });
  }, []);

  const calculateConfidence = () => {
    let score = 0.5; // Base confidence
    
    if (data.spending?.monthlySpend) score += 0.1;
    if (data.setup?.currentCards?.length > 0) score += 0.1;
    if (data.travel?.domesticTrips || data.travel?.internationalTrips) score += 0.1;
    if (data.spending?.brandAffinities?.length > 3) score += 0.1;
    if (data.setup?.feeTolerance) score += 0.05;
    
    return Math.min(score, 0.85); // Max 85% for self-report
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          pincode: data.basics?.pincode,
          employment_type: data.basics?.employmentType,
          pay_in_full_habit: data.basics?.payInFullHabit,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update user_preferences
      const { error: prefsError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          fee_tolerance_band: data.setup?.feeTolerance,
          excluded_issuers: data.setup?.excludedIssuers || [],
          reward_preference: data.travel?.rewardPreference,
          lounge_need: data.travel?.loungeNeed,
          home_airports: data.travel?.homeAirports || [],
          domestic_trips_per_year: data.travel?.domesticTrips || 0,
          international_trips_per_year: data.travel?.internationalTrips || 0,
        });

      if (prefsError) throw prefsError;

      // Insert owned cards
      if (data.setup?.currentCards?.length > 0) {
        const cardsToInsert = data.setup.currentCards.map((card: any) => ({
          user_id: user.id,
          issuer: card.issuer,
          product: card.product,
          network: card.network,
          is_primary: false,
        }));

        const { error: cardsError } = await supabase
          .from("user_owned_cards")
          .insert(cardsToInsert);

        if (cardsError) throw cardsError;
      }

      // Insert brand affinities
      if (data.spending?.brandAffinities?.length > 0) {
        const affinitiesToInsert = data.spending.brandAffinities.map((item: any) => ({
          user_id: user.id,
          brand: item.brand,
          category: item.category,
          affinity_score: 0.7,
          source: "self_report",
        }));

        const { error: affinitiesError } = await supabase
          .from("brand_affinities")
          .insert(affinitiesToInsert);

        if (affinitiesError) throw affinitiesError;
      }

      // Create/update user_features
      const confidence = calculateConfidence();
      const { error: featuresError } = await supabase
        .from("user_features")
        .upsert({
          user_id: user.id,
          monthly_spend_estimate: data.spending?.monthlySpend || 0,
          spend_split_json: data.spending?.spendSplit || {},
          online_share: (data.spending?.spendSplit?.online || 0) / 100,
          dining_share: (data.spending?.spendSplit?.dining || 0) / 100,
          groceries_share: (data.spending?.spendSplit?.groceries || 0) / 100,
          travel_share: (data.spending?.spendSplit?.travel || 0) / 100,
          cabs_fuel_share: (data.spending?.spendSplit?.fuel || 0) / 100,
          bills_utilities_share: (data.spending?.spendSplit?.bills || 0) / 100,
          entertainment_share: (data.spending?.spendSplit?.entertainment || 0) / 100,
          forex_share: (data.spending?.spendSplit?.forex || 0) / 100,
          pif_score: data.basics?.payInFullHabit === "always" ? 1.0 : 0.8,
          fee_tolerance_numeric: data.setup?.feeTolerance === "zero" ? 0 : 
                                  data.setup?.feeTolerance === "<=1k" ? 1000 :
                                  data.setup?.feeTolerance === "<=5k" ? 5000 : 999999,
          data_source: "self_report",
          feature_confidence: confidence,
        });

      if (featuresError) throw featuresError;

      // Clear localStorage
      localStorage.removeItem("onboarding_basics");
      localStorage.removeItem("onboarding_setup");
      localStorage.removeItem("onboarding_spending");
      localStorage.removeItem("onboarding_travel");

      toast.success("Profile setup complete!");
      navigate("/upload");
      
    } catch (error: any) {
      console.error("Onboarding submission error:", error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confidence = calculateConfidence();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Review Your Profile</CardTitle>
          <CardDescription>
            Verify your information before we generate recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence Badge */}
          <div className="bg-primary/10 p-4 rounded-lg flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">Recommendation Confidence</p>
              <p className="text-sm text-muted-foreground">
                {Math.round(confidence * 100)}% - Upload statements for even better accuracy
              </p>
            </div>
          </div>

          {/* Spending Summary */}
          {data.spending?.monthlySpend && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Spending Patterns</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/onboarding/spending")}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold">₹{data.spending.monthlySpend?.toLocaleString('en-IN')}/month</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.spending.spendSplit || {})
                    .filter(([_, val]) => (val as number) > 5)
                    .sort(([_, a], [__, b]) => (b as number) - (a as number))
                    .map(([cat, val]) => (
                      <Badge key={cat} variant="secondary">
                        {cat}: {(val as number).toFixed(0)}%
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Cards */}
          {data.setup?.currentCards?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Current Cards</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/onboarding/setup")}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.setup.currentCards.map((card: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{card.product} ({card.issuer})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Travel Preferences */}
          {(data.travel?.domesticTrips > 0 || data.travel?.internationalTrips > 0) && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Travel Profile</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/onboarding/travel")}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  {data.travel.domesticTrips || 0} domestic + {data.travel.internationalTrips || 0} international trips/year
                </p>
                <p className="text-sm text-muted-foreground">
                  Lounge: {data.travel.loungeNeed || "nice"} • Prefers: {data.travel.rewardPreference || "either"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => navigate("/onboarding/travel")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Complete Setup"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingRecap;
