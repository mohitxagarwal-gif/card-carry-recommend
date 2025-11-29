/**
 * Phase 2: Canonical Category Normalizer
 * Maps all category variations from different sources to canonical keys
 */

// Canonical spending categories - single source of truth
export const CANONICAL_CATEGORIES = [
  'food_dining',
  'shopping_online',
  'travel',
  'groceries',
  'fuel',
  'bills_utilities',
  'entertainment',
  'health',
  'education',
  'investments',
  'forex',
  'other'
] as const;

export type CanonicalCategory = typeof CANONICAL_CATEGORIES[number];

// Mapping from UI keys and transaction categories to canonical categories
const CATEGORY_MAP: Record<string, CanonicalCategory> = {
  // From QuickSpendingHints UI
  'Online Shopping': 'shopping_online',
  'Food Delivery': 'food_dining',
  'Dining Out': 'food_dining',
  'Groceries': 'groceries',
  'Travel': 'travel',
  'Entertainment': 'entertainment',
  'Fuel': 'fuel',
  'Bills': 'bills_utilities',
  'Health': 'health',
  'Education': 'education',
  
  // From SpendingSliders
  'online': 'shopping_online',
  'dining': 'food_dining',
  'cabsFuel': 'fuel',
  'billsUtilities': 'bills_utilities',
  'rent': 'other',
  'forex': 'forex',
  'upiCC': 'other',
  
  // From transaction categories (categories.ts)
  'Online': 'shopping_online',
  'Dining': 'food_dining',
  'Food': 'food_dining',
  'Grocery': 'groceries',
  'Transport': 'travel',
  'Cabs': 'fuel',
  'Utilities': 'bills_utilities',
  'Healthcare': 'health',
  'Medical': 'health',
  'Investment': 'investments',
  'Investments': 'investments',
  'Foreign': 'forex',
  'International': 'forex',
  'Shopping': 'shopping_online',
  'Rent': 'other',
  'UPI': 'other',
  'Other': 'other',
  
  // Additional common variations
  'food_delivery': 'food_dining',
  'dining_out': 'food_dining',
  'restaurant': 'food_dining',
  'swiggy': 'food_dining',
  'zomato': 'food_dining',
  'bigbasket': 'groceries',
  'dmart': 'groceries',
  'uber': 'fuel',
  'ola': 'fuel',
  'petrol': 'fuel',
  'gas': 'fuel',
  'electricity': 'bills_utilities',
  'water': 'bills_utilities',
  'phone': 'bills_utilities',
  'internet': 'bills_utilities',
  'streaming': 'entertainment',
  'netflix': 'entertainment',
  'amazon_prime': 'entertainment',
  'movies': 'entertainment',
  'makemytrip': 'travel',
  'goibibo': 'travel',
  'flight': 'travel',
  'hotel': 'travel',
  'amazon': 'shopping_online',
  'flipkart': 'shopping_online',
  'myntra': 'shopping_online',
};

/**
 * Normalize any category string to canonical category
 * Logs unmapped categories for analytics
 */
export function normalizeToCanonical(input: string | null | undefined): CanonicalCategory {
  if (!input) return 'other';
  
  // Try exact match (case-insensitive)
  const normalized = input.trim();
  const lowerInput = normalized.toLowerCase();
  
  // Check direct match
  const directMatch = CATEGORY_MAP[normalized] || CATEGORY_MAP[lowerInput];
  if (directMatch) return directMatch;
  
  // Try partial match
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lowerInput.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerInput)) {
      console.log(`[categoryNormalizer] Partial match: "${input}" → ${value}`);
      return value;
    }
  }
  
  // Log unmapped for analytics
  console.warn(`[categoryNormalizer] Unmapped category: "${input}" → other`);
  return 'other';
}

/**
 * Convert spendSplit object with percentages to canonical shares (0.0-1.0)
 * Returns object with canonical keys and normalized values
 */
export function convertSpendSplitToShares(
  spendSplit: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};
  
  // Initialize all canonical categories to 0
  CANONICAL_CATEGORIES.forEach(cat => {
    result[cat + '_share'] = 0;
  });
  
  let total = 0;
  const entries: [CanonicalCategory, number][] = [];
  
  // Normalize each category and collect values
  for (const [key, value] of Object.entries(spendSplit)) {
    const canonical = normalizeToCanonical(key);
    entries.push([canonical, value]);
    total += value;
  }
  
  // Convert to 0-1 fractions
  if (total > 0) {
    for (const [canonical, value] of entries) {
      const shareKey = canonical + '_share';
      // If value is already a fraction (0-1), use as-is, else convert from percentage
      const fraction = value <= 1 ? value : value / 100;
      result[shareKey] = (result[shareKey] || 0) + fraction;
    }
  }
  
  // Normalize to sum to 1.0 if close
  const sum = Object.values(result).reduce((a, b) => a + b, 0);
  if (sum > 0.9 && sum < 1.1) {
    for (const key of Object.keys(result)) {
      result[key] = result[key] / sum;
    }
  }
  
  return result;
}

/**
 * Type guard to check if a string is a canonical category
 */
export function isCanonicalCategory(value: string): value is CanonicalCategory {
  return CANONICAL_CATEGORIES.includes(value as CanonicalCategory);
}

/**
 * Get user-friendly display name for canonical category
 */
export function getDisplayName(canonical: CanonicalCategory): string {
  const displayMap: Record<CanonicalCategory, string> = {
    'food_dining': 'Food & Dining',
    'shopping_online': 'Online Shopping',
    'travel': 'Travel',
    'groceries': 'Groceries',
    'fuel': 'Fuel & Transport',
    'bills_utilities': 'Bills & Utilities',
    'entertainment': 'Entertainment',
    'health': 'Healthcare',
    'education': 'Education',
    'investments': 'Investments',
    'forex': 'International',
    'other': 'Other'
  };
  
  return displayMap[canonical] || canonical;
}