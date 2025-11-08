// Phase 4: EAV Scoring Engine
// Matches user features with card benefits to generate match scores

export interface UserFeatures {
  pif_score: number; // 0-100: likelihood to pay in full
  fee_tolerance_numeric: number; // 0-5000: max fee willing to pay
  travel_numeric: number; // 0-10: travel frequency score
  lounge_numeric: number; // 0-10: lounge importance score
  forex_spend_pct: number; // 0-100: % of spend on forex
  acceptance_risk_amex: number; // 0-100: willingness to use Amex
  total_monthly_spend: number; // Total spending
  category_spend: Record<string, number>; // Category-wise spending
}

export interface CardBenefit {
  benefit_type: string;
  benefit_key: string;
  display_name: string;
  benefit_value_type: 'boolean' | 'numeric' | 'text';
  benefit_value_data: any;
}

export interface CardEligibility {
  min_income?: number;
  min_age?: number;
  min_credit_score?: number;
  accept_salaried: boolean;
  accept_self_employed: boolean;
  cities_available?: string[];
}

export interface CardFeatures {
  card_id: string;
  name: string;
  issuer: string;
  network: string;
  annual_fee: number;
  waiver_rule?: string;
  forex_markup_pct: number;
  benefits: CardBenefit[];
  eligibility?: CardEligibility;
  reward_type: string[];
  category_badges: string[];
}

interface ScoringWeights {
  feeAffordability: number;
  rewardRelevance: number;
  travelFit: number;
  categoryAlignment: number;
  networkAcceptance: number;
  eligibility: number;
  loyaltyPotential: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  feeAffordability: 0.20,
  rewardRelevance: 0.25,
  travelFit: 0.15,
  categoryAlignment: 0.20,
  networkAcceptance: 0.10,
  eligibility: 0.05,
  loyaltyPotential: 0.05
};

/**
 * Calculate match score between user features and a card
 * Returns score 0-100 and breakdown of scoring components
 */
export function calculateCardMatchScore(
  userFeatures: UserFeatures,
  card: CardFeatures,
  userProfile?: { income_band_inr?: string; age_range?: string; city?: string },
  weights: ScoringWeights = DEFAULT_WEIGHTS
): { score: number; breakdown: Record<string, number>; explanation: string[] } {
  
  const breakdown: Record<string, number> = {};
  const explanation: string[] = [];

  // 1. Fee Affordability Score (0-100)
  const feeScore = calculateFeeScore(userFeatures.fee_tolerance_numeric, card.annual_fee, card.waiver_rule);
  breakdown.feeAffordability = feeScore;
  if (feeScore >= 80) {
    explanation.push(`Fee of ₹${card.annual_fee} fits your budget${card.waiver_rule ? ' with easy waiver' : ''}`);
  } else if (feeScore < 40) {
    explanation.push(`Higher fee (₹${card.annual_fee}) compared to your preference`);
  }

  // 2. Reward Relevance Score (0-100)
  const rewardScore = calculateRewardScore(userFeatures, card);
  breakdown.rewardRelevance = rewardScore;
  if (rewardScore >= 70) {
    explanation.push(`Strong rewards match your spending patterns`);
  }

  // 3. Travel Fit Score (0-100)
  const travelScore = calculateTravelScore(userFeatures, card);
  breakdown.travelFit = travelScore;
  if (travelScore >= 75 && userFeatures.travel_numeric > 6) {
    explanation.push(`Excellent travel benefits for your frequent travel`);
  } else if (travelScore < 30 && userFeatures.travel_numeric > 7) {
    explanation.push(`Limited travel benefits despite your travel needs`);
  }

  // 4. Category Alignment Score (0-100)
  const categoryScore = calculateCategoryAlignment(userFeatures.category_spend, card);
  breakdown.categoryAlignment = categoryScore;
  if (categoryScore >= 75) {
    explanation.push(`Benefits align perfectly with your top spending categories`);
  }

  // 5. Network Acceptance Score (0-100)
  const networkScore = calculateNetworkScore(card.network, userFeatures.acceptance_risk_amex);
  breakdown.networkAcceptance = networkScore;
  if (networkScore < 50 && card.network === 'American Express') {
    explanation.push(`American Express has limited acceptance in India`);
  }

  // 6. Eligibility Score (0-100)
  const eligibilityScore = calculateEligibilityScore(card.eligibility, userProfile);
  breakdown.eligibility = eligibilityScore;
  if (eligibilityScore < 60) {
    explanation.push(`May not meet all eligibility criteria`);
  }

  // 7. Loyalty Potential Score (0-100)
  const loyaltyScore = calculateLoyaltyScore(userFeatures, card);
  breakdown.loyaltyPotential = loyaltyScore;

  // Calculate weighted total score
  const totalScore = Math.round(
    feeScore * weights.feeAffordability +
    rewardScore * weights.rewardRelevance +
    travelScore * weights.travelFit +
    categoryScore * weights.categoryAlignment +
    networkScore * weights.networkAcceptance +
    eligibilityScore * weights.eligibility +
    loyaltyScore * weights.loyaltyPotential
  );

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown,
    explanation
  };
}

function calculateFeeScore(feeTolerance: number, annualFee: number, waiverRule?: string): number {
  if (annualFee === 0) return 100;
  
  // If there's an easy waiver rule, reduce effective fee
  const effectiveFee = waiverRule ? annualFee * 0.5 : annualFee;
  
  if (effectiveFee <= feeTolerance * 0.5) return 100;
  if (effectiveFee <= feeTolerance) return 80;
  if (effectiveFee <= feeTolerance * 1.5) return 60;
  if (effectiveFee <= feeTolerance * 2) return 40;
  return 20;
}

function calculateRewardScore(userFeatures: UserFeatures, card: CardFeatures): number {
  let score = 50; // Base score

  const hasCashback = card.reward_type.includes('cashback');
  const hasPoints = card.reward_type.includes('points');
  
  // Check for category-specific benefits
  const benefitKeys = card.benefits.map(b => b.benefit_key);
  
  // Dining benefits
  if (benefitKeys.includes('cashback_dining') && userFeatures.category_spend['Dining'] > 0) {
    score += 15;
  }
  
  // Grocery benefits
  if (benefitKeys.includes('cashback_grocery') && userFeatures.category_spend['Grocery'] > 0) {
    score += 15;
  }
  
  // Fuel benefits
  if (benefitKeys.includes('cashback_fuel') && userFeatures.category_spend['Fuel'] > 0) {
    score += 10;
  }
  
  // Food delivery benefits
  if (benefitKeys.includes('food_delivery_boost') && userFeatures.category_spend['Food Delivery'] > 0) {
    score += 15;
  }
  
  // E-commerce benefits
  if (benefitKeys.includes('ecommerce_boost') && userFeatures.category_spend['Online Shopping'] > 0) {
    score += 15;
  }

  return Math.min(100, score);
}

function calculateTravelScore(userFeatures: UserFeatures, card: CardFeatures): number {
  const travelNeeds = userFeatures.travel_numeric;
  if (travelNeeds < 3) return 100; // Low travel needs = travel benefits don't matter much
  
  let score = 0;
  const benefitKeys = card.benefits.map(b => b.benefit_key);
  
  // Lounge access
  if (benefitKeys.includes('domestic_lounge')) score += 20;
  if (benefitKeys.includes('intl_lounge')) score += 20;
  if (benefitKeys.includes('priority_pass')) score += 25;
  
  // Forex benefits
  if (userFeatures.forex_spend_pct > 5) {
    if (benefitKeys.includes('forex_markup_zero')) score += 20;
    else if (benefitKeys.includes('forex_markup_low') && card.forex_markup_pct <= 2) score += 15;
  }
  
  // Flight/hotel benefits
  if (benefitKeys.includes('flight_discount')) score += 10;
  if (benefitKeys.includes('hotel_discount')) score += 10;
  
  // Travel insurance
  if (benefitKeys.includes('travel_insurance')) score += 5;
  
  return Math.min(100, score);
}

function calculateCategoryAlignment(categorySpend: Record<string, number>, card: CardFeatures): number {
  const totalSpend = Object.values(categorySpend).reduce((sum, val) => sum + val, 0);
  if (totalSpend === 0) return 50;
  
  let alignedSpend = 0;
  const benefitKeys = card.benefits.map(b => b.benefit_key);
  
  // Map benefit keys to spending categories
  const categoryBenefitMap: Record<string, string[]> = {
    'Dining': ['cashback_dining'],
    'Grocery': ['cashback_grocery'],
    'Fuel': ['cashback_fuel'],
    'Food Delivery': ['food_delivery_boost'],
    'Online Shopping': ['ecommerce_boost', 'shopping_boost'],
    'Entertainment': ['entertainment_boost'],
    'Travel': ['flight_discount', 'hotel_discount', 'forex_markup_zero', 'forex_markup_low'],
    'Utilities': ['cashback_utilities'],
    'Shopping': ['shopping_boost']
  };
  
  // Calculate percentage of spending that has matching benefits
  for (const [category, spend] of Object.entries(categorySpend)) {
    const matchingBenefits = categoryBenefitMap[category] || [];
    if (matchingBenefits.some(b => benefitKeys.includes(b))) {
      alignedSpend += spend;
    }
  }
  
  const alignmentPct = (alignedSpend / totalSpend) * 100;
  
  // General cashback always provides some value
  if (benefitKeys.includes('cashback_general')) {
    return Math.max(alignmentPct, 60);
  }
  
  return Math.min(100, alignmentPct);
}

function calculateNetworkScore(network: string, amexAcceptance: number): number {
  if (network === 'Visa' || network === 'Mastercard') return 100;
  if (network === 'RuPay') return 95;
  if (network === 'American Express') return amexAcceptance;
  return 80;
}

function calculateEligibilityScore(
  eligibility?: CardEligibility,
  userProfile?: { income_band_inr?: string; age_range?: string; city?: string }
): number {
  if (!eligibility || !userProfile) return 80; // Assume eligible if no data
  
  let score = 100;
  
  // Income check
  if (eligibility.min_income && userProfile.income_band_inr) {
    const incomeMidpoint = getIncomeBandMidpoint(userProfile.income_band_inr);
    if (incomeMidpoint < eligibility.min_income) {
      score -= 40;
    }
  }
  
  // Age check
  if (eligibility.min_age && userProfile.age_range) {
    const ageMidpoint = getAgeRangeMidpoint(userProfile.age_range);
    if (ageMidpoint < eligibility.min_age) {
      score -= 30;
    }
  }
  
  // City availability
  if (eligibility.cities_available && userProfile.city) {
    if (!eligibility.cities_available.includes(userProfile.city)) {
      score -= 20;
    }
  }
  
  return Math.max(0, score);
}

function calculateLoyaltyScore(userFeatures: UserFeatures, card: CardFeatures): number {
  // Users who pay in full are better customers
  const pifBonus = userFeatures.pif_score * 0.3;
  
  // High spenders are more valuable
  const spendBonus = Math.min(30, (userFeatures.total_monthly_spend / 50000) * 30);
  
  // Cards with milestone bonuses reward loyalty
  const hasMilestones = card.benefits.some(b => b.benefit_key === 'milestone_bonus');
  const milestoneBonus = hasMilestones ? 20 : 0;
  
  return Math.min(100, 20 + pifBonus + spendBonus + milestoneBonus);
}

function getIncomeBandMidpoint(band: string): number {
  const map: Record<string, number> = {
    '0-25000': 12500,
    '25000-50000': 37500,
    '50000-100000': 75000,
    '100000-200000': 150000,
    '200000+': 250000
  };
  return map[band] || 50000;
}

function getAgeRangeMidpoint(range: string): number {
  const map: Record<string, number> = {
    '18-25': 21,
    '26-35': 30,
    '36-45': 40,
    '46-60': 53,
    '60+': 65
  };
  return map[range] || 30;
}

/**
 * Rank cards by match score
 */
export function rankCards(
  userFeatures: UserFeatures,
  cards: CardFeatures[],
  userProfile?: { income_band_inr?: string; age_range?: string; city?: string },
  topN: number = 5
): Array<CardFeatures & { matchScore: number; scoreBreakdown: Record<string, number>; matchExplanation: string[] }> {
  
  const scoredCards = cards.map(card => {
    const { score, breakdown, explanation } = calculateCardMatchScore(userFeatures, card, userProfile);
    return {
      ...card,
      matchScore: score,
      scoreBreakdown: breakdown,
      matchExplanation: explanation
    };
  });
  
  // Sort by score descending
  return scoredCards
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
}
