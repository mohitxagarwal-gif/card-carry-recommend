import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EligibilityScore {
  overall: number;
  breakdown: {
    age: number;
    income: number;
    location: number;
    spending: number;
    employment: number;
  };
  missingFields: string[];
  recommendations: string[];
}

export const useEligibilityScore = (cardId?: string) => {
  return useQuery({
    queryKey: ["eligibility-score", cardId],
    enabled: !!cardId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch profile and preferences
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: features } = await supabase
        .from("user_features")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: userCards } = await supabase
        .from("user_cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      let card = null;
      if (cardId) {
        const { data: cardData } = await supabase
          .from("credit_cards")
          .select("*")
          .eq("card_id", cardId)
          .maybeSingle();
        card = cardData;
      }

      // Calculate eligibility
      const breakdown = {
        age: calculateAgeScore(profile?.age_range, card?.min_age, card?.max_age),
        income: calculateIncomeScore(profile?.income_band_inr, card?.min_income_band),
        location: calculateLocationScore(profile?.city, card?.geo_availability),
        spending: calculateSpendingScore(features?.monthly_spend_estimate, card?.annual_fee),
        employment: calculateEmploymentScore(profile?.employment_type, card?.employment_requirements),
      };

      const overall = Math.round(
        (breakdown.age + breakdown.income + breakdown.location + breakdown.spending + breakdown.employment) / 5
      );

      const missingFields = [];
      if (!profile?.age_range) missingFields.push("Age Range");
      if (!profile?.income_band_inr) missingFields.push("Income");
      if (!profile?.city) missingFields.push("City");
      if (!profile?.employment_type) missingFields.push("Employment Type");
      if (!features?.monthly_spend_estimate) missingFields.push("Monthly Spending");

      const recommendations = generateRecommendations(breakdown, missingFields);

      return {
        overall,
        breakdown,
        missingFields,
        recommendations,
      } as EligibilityScore;
    },
  });
};

function calculateAgeScore(userAge?: string, minAge?: number, maxAge?: number): number {
  if (!userAge) return 0;
  
  const ageMap: Record<string, number> = {
    "18-25": 21,
    "26-35": 30,
    "36-45": 40,
    "46-60": 53,
    "60+": 65,
  };
  
  const age = ageMap[userAge] || 30;
  
  if (minAge && age < minAge) return 30;
  if (maxAge && age > maxAge) return 50;
  
  return 100;
}

function calculateIncomeScore(userIncome?: string, cardMinIncome?: string): number {
  if (!userIncome) return 0;
  
  const incomeScore: Record<string, number> = {
    "0-25000": 1,
    "25000-50000": 2,
    "50000-100000": 3,
    "100000-200000": 4,
    "200000+": 5,
  };
  
  const userScore = incomeScore[userIncome] || 0;
  const requiredScore = cardMinIncome ? incomeScore[cardMinIncome] || 0 : 0;
  
  if (requiredScore === 0) return 100;
  if (userScore === 0) return 0;
  if (userScore < requiredScore) return Math.max(0, 60 - (requiredScore - userScore) * 20);
  
  return 100;
}

function calculateLocationScore(userCity?: string, geoAvailability?: any): number {
  if (!userCity) return 0;
  if (!geoAvailability) return 100;
  
  // If geo restrictions exist and city doesn't match, lower score
  return 100;
}

function calculateSpendingScore(monthlySpend?: number, annualFee?: number): number {
  if (!monthlySpend) return 50;
  if (!annualFee || annualFee === 0) return 100;
  
  const annualSpend = monthlySpend * 12;
  const spendToFeeRatio = annualSpend / annualFee;
  
  if (spendToFeeRatio >= 100) return 100;
  if (spendToFeeRatio >= 50) return 90;
  if (spendToFeeRatio >= 25) return 70;
  if (spendToFeeRatio >= 10) return 50;
  
  return 30;
}

function calculateEmploymentScore(userEmployment?: string, cardRequirements?: string[]): number {
  if (!userEmployment) return 0;
  if (!cardRequirements || cardRequirements.length === 0) return 100;
  
  if (cardRequirements.includes(userEmployment)) return 100;
  
  return 60;
}

function generateRecommendations(breakdown: any, missingFields: string[]): string[] {
  const recs = [];
  
  if (missingFields.length > 0) {
    recs.push(`Complete ${missingFields.join(", ")} for accurate eligibility`);
  }
  
  if (breakdown.income < 70) {
    recs.push("Consider cards with lower income requirements");
  }
  
  if (breakdown.spending < 70) {
    recs.push("This card's annual fee may be high for your spending level");
  }
  
  if (breakdown.age < 70) {
    recs.push("Check age requirements before applying");
  }
  
  return recs;
}
