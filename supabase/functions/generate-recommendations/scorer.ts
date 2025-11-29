// EAV Scoring Logic for Edge Function
// Simplified version for Deno environment

export interface UserFeatures {
  pif_score: number;
  fee_tolerance_numeric: number;
  acceptance_risk_amex: number;
  monthly_spend_estimate: number;
  dining_share: number;
  groceries_share: number;
  travel_share: number;
  entertainment_share: number;
  online_share: number;
  forex_share: number;
  category_spend: Record<string, number>;
}

export interface CardEarnRate {
  category: string;
  earn_rate: number;
  earn_type: string;
  earn_rate_unit: string;
}

export interface CardWithEarnRates {
  id: string;
  card_id: string;
  name: string;
  issuer: string;
  network: string;
  annual_fee: number;
  waiver_rule?: string;
  forex_markup_pct: number;
  reward_type: string[];
  category_badges: string[];
  earn_rates: CardEarnRate[];
}

export function calculateMatchScore(
  userFeatures: UserFeatures,
  card: CardWithEarnRates,
  customWeights?: Record<string, number>
): { score: number; explanation: string[] } {
  
  const explanation: string[] = [];
  let totalScore = 0;
  
  // Default weights (can be overridden by customWeights)
  const weights = {
    feeAffordability: customWeights?.feeAffordability ?? 0.25,
    categoryAlignment: customWeights?.categoryAlignment ?? 0.40,
    travelFit: customWeights?.travelFit ?? 0.15,
    networkAcceptance: customWeights?.networkAcceptance ?? 0.10,
    spendingMatch: customWeights?.spendingMatch ?? 0.10,
  };
  
  // 1. Fee Affordability
  const feeScore = calculateFeeScore(userFeatures.fee_tolerance_numeric, card.annual_fee, card.waiver_rule);
  totalScore += feeScore * weights.feeAffordability;
  if (feeScore >= 80) {
    explanation.push(`Affordable fee of ₹${card.annual_fee.toLocaleString()}`);
  }
  
  // 2. Category Rewards Alignment
  const categoryScore = calculateCategoryScore(userFeatures, card);
  totalScore += categoryScore * weights.categoryAlignment;
  if (categoryScore >= 70) {
    explanation.push(`Great rewards on your top categories`);
  }
  
  // 3. Travel Fit
  const travelScore = calculateTravelScore(userFeatures, card);
  totalScore += travelScore * weights.travelFit;
  if (travelScore >= 70 && userFeatures.travel_share > 0.10) {
    explanation.push(`Good travel benefits`);
  }
  
  // 4. Network Acceptance
  const networkScore = calculateNetworkScore(card.network, userFeatures.acceptance_risk_amex);
  totalScore += networkScore * weights.networkAcceptance;
  
  // 5. Spending Level Match
  const spendScore = calculateSpendingMatch(userFeatures.monthly_spend_estimate, card.annual_fee);
  totalScore += spendScore * weights.spendingMatch;
  
  return {
    score: Math.round(Math.min(100, Math.max(0, totalScore))),
    explanation
  };
}

function calculateFeeScore(feeTolerance: number, annualFee: number, waiverRule?: string): number {
  if (annualFee === 0) return 100;
  
  const effectiveFee = waiverRule ? annualFee * 0.5 : annualFee;
  
  if (effectiveFee <= feeTolerance * 0.5) return 100;
  if (effectiveFee <= feeTolerance) return 80;
  if (effectiveFee <= feeTolerance * 1.5) return 60;
  if (effectiveFee <= feeTolerance * 2) return 40;
  return 20;
}

function calculateCategoryScore(userFeatures: UserFeatures, card: CardWithEarnRates): number {
  let score = 30; // Base score
  
  // Check earn rates for user's top spending categories
  const categoryShares = {
    'Dining': userFeatures.dining_share,
    'Grocery': userFeatures.groceries_share,
    'Travel': userFeatures.travel_share,
    'Entertainment': userFeatures.entertainment_share,
    'Online Shopping': userFeatures.online_share
  };
  
  // Find top 3 categories by share
  const topCategories = Object.entries(categoryShares)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  // Check if card has good earn rates for top categories
  for (const [category, share] of topCategories) {
    if (share > 0.05) { // 5% or more of spending
      const earnRate = card.earn_rates.find(r => 
        r.category.toLowerCase().includes(category.toLowerCase())
      );
      
      if (earnRate && earnRate.earn_rate > 0) {
        // Award points based on earn rate and category importance
        const categoryWeight = share * 100; // Convert to percentage
        const earnBonus = Math.min(20, earnRate.earn_rate * 2);
        score += categoryWeight * 0.3 + earnBonus;
      }
    }
  }
  
  return Math.min(100, score);
}

function calculateTravelScore(userFeatures: UserFeatures, card: CardWithEarnRates): number {
  const travelShare = userFeatures.travel_share;
  if (travelShare < 0.05) return 100; // Low travel needs = doesn't matter
  
  let score = 40;
  
  // Check for travel category earn rates
  const travelEarn = card.earn_rates.find(r => r.category.toLowerCase().includes('travel'));
  if (travelEarn && travelEarn.earn_rate > 0) {
    score += Math.min(40, travelEarn.earn_rate * 4);
  }
  
  // Forex markup matters for international travel
  if (userFeatures.forex_share > 0.02) { // >2% forex spending
    if (card.forex_markup_pct === 0) score += 20;
    else if (card.forex_markup_pct <= 2) score += 10;
  }
  
  return Math.min(100, score);
}

function calculateNetworkScore(network: string, amexAcceptance: number): number {
  if (network === 'Visa' || network === 'Mastercard') return 100;
  if (network === 'RuPay') return 95;
  if (network === 'American Express') return amexAcceptance;
  return 80;
}

function calculateSpendingMatch(monthlySpend: number, annualFee: number): number {
  if (annualFee === 0) return 100;
  
  // Card should generate at least 2x annual fee in value
  const requiredSpend = (annualFee * 2) / 12; // Monthly spend needed
  
  if (monthlySpend >= requiredSpend * 2) return 100;
  if (monthlySpend >= requiredSpend) return 80;
  if (monthlySpend >= requiredSpend * 0.7) return 60;
  if (monthlySpend >= requiredSpend * 0.5) return 40;
  return 20;
}
