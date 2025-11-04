// Phase 0: Single source of truth for transaction categories

export const STANDARD_CATEGORIES = [
  "Food & Dining",
  "Shopping & E-commerce",
  "Travel & Transport",
  "Bills & Utilities",
  "Entertainment & Subscriptions",
  "Health & Wellness",
  "Education",
  "Investments & Savings",
  "Other"
] as const;

export type StandardCategory = typeof STANDARD_CATEGORIES[number];

/**
 * Normalizes category names to standard Title Case format
 * Maps common variations to canonical names
 */
export function normalizeCategory(category: string | null | undefined): StandardCategory {
  if (!category) return "Other";
  
  const lower = category.toLowerCase().trim();
  
  // Direct mappings for common variations
  const mappings: Record<string, StandardCategory> = {
    "food & dining": "Food & Dining",
    "food and dining": "Food & Dining",
    "food_and_dining": "Food & Dining",
    "food": "Food & Dining",
    "dining": "Food & Dining",
    
    "shopping & e-commerce": "Shopping & E-commerce",
    "shopping and e-commerce": "Shopping & E-commerce",
    "shopping_and_ecommerce": "Shopping & E-commerce",
    "shopping": "Shopping & E-commerce",
    "ecommerce": "Shopping & E-commerce",
    "e-commerce": "Shopping & E-commerce",
    
    "travel & transport": "Travel & Transport",
    "travel and transport": "Travel & Transport",
    "travel_and_transport": "Travel & Transport",
    "travel": "Travel & Transport",
    "transport": "Travel & Transport",
    "transportation": "Travel & Transport",
    
    "bills & utilities": "Bills & Utilities",
    "bills and utilities": "Bills & Utilities",
    "bills_and_utilities": "Bills & Utilities",
    "bills": "Bills & Utilities",
    "utilities": "Bills & Utilities",
    
    "entertainment & subscriptions": "Entertainment & Subscriptions",
    "entertainment and subscriptions": "Entertainment & Subscriptions",
    "entertainment_and_subscriptions": "Entertainment & Subscriptions",
    "entertainment": "Entertainment & Subscriptions",
    "subscriptions": "Entertainment & Subscriptions",
    
    "health & wellness": "Health & Wellness",
    "health and wellness": "Health & Wellness",
    "health_and_wellness": "Health & Wellness",
    "health": "Health & Wellness",
    "wellness": "Health & Wellness",
    "healthcare": "Health & Wellness",
    
    "education": "Education",
    
    "investments & savings": "Investments & Savings",
    "investments and savings": "Investments & Savings",
    "investments_and_savings": "Investments & Savings",
    "investments": "Investments & Savings",
    "savings": "Investments & Savings",
    
    "other": "Other",
    "miscellaneous": "Other",
    "misc": "Other",
    "uncategorized": "Other"
  };
  
  return mappings[lower] || "Other";
}

/**
 * Validates if a category is a standard category
 */
export function isStandardCategory(category: string): category is StandardCategory {
  return STANDARD_CATEGORIES.includes(category as StandardCategory);
}
