// EAV Scoring Logic for Edge Function
// Simplified version for Deno environment

export interface UserFeatures {
  pif_score: number;
  fee_tolerance_numeric: number;
  travel_numeric: number;
  lounge_numeric: number;
  forex_spend_pct: number;
  acceptance_risk_amex: number;
  total_monthly_spend: number;
  category_spend: Record<string, number>;
}

export interface CardBenefit {
  benefit_type: string;
  benefit_key: string;
  benefit_value_type: 'boolean' | 'numeric' | 'text';
}

export interface CardWithBenefits {
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
  benefits: CardBenefit[];
}

export function calculateMatchScore(
  userFeatures: UserFeatures,
  card: CardWithBenefits
): { score: number; explanation: string[] } {
  
  const explanation: string[] = [];
  let totalScore = 0;
  
  // 1. Fee Affordability (20%)
  const feeScore = calculateFeeScore(userFeatures.fee_tolerance_numeric, card.annual_fee, card.waiver_rule);
  totalScore += feeScore * 0.20;
  if (feeScore >= 80) {
    explanation.push(`Fee of ₹${card.annual_fee.toLocaleString()} fits budget`);
  }
  
  // 2. Category Alignment (30%)
  const categoryScore = calculateCategoryScore(userFeatures.category_spend, card);
  totalScore += categoryScore * 0.30;
  if (categoryScore >= 70) {
    explanation.push(`Strong match with spending categories`);
  }
  
  // 3. Travel Fit (20%)
  const travelScore = calculateTravelScore(userFeatures, card);
  totalScore += travelScore * 0.20;
  if (travelScore >= 75 && userFeatures.travel_numeric > 6) {
    explanation.push(`Excellent travel benefits`);
  }
  
  // 4. Network Acceptance (15%)
  const networkScore = calculateNetworkScore(card.network, userFeatures.acceptance_risk_amex);
  totalScore += networkScore * 0.15;
  
  // 5. Reward Type Match (15%)
  const rewardScore = calculateRewardScore(userFeatures, card);
  totalScore += rewardScore * 0.15;
  if (rewardScore >= 70) {
    explanation.push(`Rewards match your preferences`);
  }
  
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

function calculateCategoryScore(categorySpend: Record<string, number>, card: CardWithBenefits): number {
  const totalSpend = Object.values(categorySpend).reduce((sum, val) => sum + val, 0);
  if (totalSpend === 0) return 50;
  
  let alignedSpend = 0;
  const benefitKeys = card.benefits.map(b => b.benefit_key);
  
  const categoryMap: Record<string, string[]> = {
    'Dining': ['cashback_dining'],
    'Grocery': ['cashback_grocery'],
    'Fuel': ['cashback_fuel'],
    'Food Delivery': ['food_delivery_boost'],
    'Online Shopping': ['ecommerce_boost', 'shopping_boost'],
    'Entertainment': ['entertainment_boost'],
    'Travel': ['flight_discount', 'hotel_discount', 'forex_markup_zero'],
    'Utilities': ['cashback_utilities']
  };
  
  for (const [category, spend] of Object.entries(categorySpend)) {
    const matchingBenefits = categoryMap[category] || [];
    if (matchingBenefits.some(b => benefitKeys.includes(b))) {
      alignedSpend += spend;
    }
  }
  
  const alignmentPct = (alignedSpend / totalSpend) * 100;
  
  if (benefitKeys.includes('cashback_general')) {
    return Math.max(alignmentPct, 60);
  }
  
  return Math.min(100, alignmentPct);
}

function calculateTravelScore(userFeatures: UserFeatures, card: CardWithBenefits): number {
  const travelNeeds = userFeatures.travel_numeric;
  if (travelNeeds < 3) return 100;
  
  let score = 0;
  const benefitKeys = card.benefits.map(b => b.benefit_key);
  
  if (benefitKeys.includes('domestic_lounge')) score += 20;
  if (benefitKeys.includes('intl_lounge')) score += 20;
  if (benefitKeys.includes('priority_pass')) score += 25;
  
  if (userFeatures.forex_spend_pct > 5) {
    if (benefitKeys.includes('forex_markup_zero')) score += 20;
    else if (card.forex_markup_pct <= 2) score += 15;
  }
  
  if (benefitKeys.includes('flight_discount')) score += 10;
  if (benefitKeys.includes('hotel_discount')) score += 10;
  
  return Math.min(100, score);
}

function calculateNetworkScore(network: string, amexAcceptance: number): number {
  if (network === 'Visa' || network === 'Mastercard') return 100;
  if (network === 'RuPay') return 95;
  if (network === 'American Express') return amexAcceptance;
  return 80;
}

function calculateRewardScore(userFeatures: UserFeatures, card: CardWithBenefits): number {
  let score = 50;
  const benefitKeys = card.benefits.map(b => b.benefit_key);
  
  const topCategories = Object.entries(userFeatures.category_spend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
  
  if (topCategories.includes('Dining') && benefitKeys.includes('cashback_dining')) score += 15;
  if (topCategories.includes('Grocery') && benefitKeys.includes('cashback_grocery')) score += 15;
  if (topCategories.includes('Food Delivery') && benefitKeys.includes('food_delivery_boost')) score += 15;
  if (topCategories.includes('Online Shopping') && benefitKeys.includes('ecommerce_boost')) score += 15;
  
  if (benefitKeys.includes('cashback_general')) score += 10;
  
  return Math.min(100, score);
}
