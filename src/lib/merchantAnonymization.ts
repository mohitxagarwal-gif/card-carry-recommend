const SENSITIVE_CATEGORIES = [
  'health',
  'medical',
  'healthcare',
  'hospital',
  'clinic',
  'pharmacy',
  'adult_entertainment',
  'gambling',
  'casino',
  'betting',
  'counseling',
  'therapy',
  'mental_health',
  'personal_services'
];

const CATEGORY_LABELS: Record<string, string> = {
  'health': 'Healthcare Provider',
  'medical': 'Medical Services',
  'healthcare': 'Healthcare Provider',
  'hospital': 'Hospital',
  'clinic': 'Medical Clinic',
  'pharmacy': 'Pharmacy',
  'adult_entertainment': 'Entertainment',
  'gambling': 'Gaming Services',
  'casino': 'Gaming Services',
  'betting': 'Gaming Services',
  'counseling': 'Professional Services',
  'therapy': 'Professional Services',
  'mental_health': 'Healthcare Provider',
  'personal_services': 'Personal Services'
};

export function isSensitiveCategory(category: string | null): boolean {
  if (!category) return false;
  const lower = category.toLowerCase();
  return SENSITIVE_CATEGORIES.some(sensitive => lower.includes(sensitive));
}

export function getDisplayMerchantName(
  merchantName: string,
  category: string | null,
  subcategory?: string | null,
  isAdminView: boolean = false
): string {
  // Admin views always see real merchant names
  if (isAdminView) {
    return merchantName;
  }
  
  // Check if category or subcategory is sensitive
  if (isSensitiveCategory(category) || isSensitiveCategory(subcategory)) {
    const categoryKey = (category || '').toLowerCase();
    return CATEGORY_LABELS[categoryKey] || 'Private Transaction';
  }
  
  return merchantName;
}

export function anonymizeTransactionsForExport(
  transactions: any[],
  isAdminExport: boolean = false
): any[] {
  return transactions.map(txn => ({
    ...txn,
    merchant_raw: getDisplayMerchantName(
      txn.merchant_raw,
      txn.category,
      txn.subcategory,
      isAdminExport
    ),
    merchant_normalized: getDisplayMerchantName(
      txn.merchant_normalized,
      txn.category,
      txn.subcategory,
      isAdminExport
    ),
    merchant_canonical: txn.merchant_canonical ? getDisplayMerchantName(
      txn.merchant_canonical,
      txn.category,
      txn.subcategory,
      isAdminExport
    ) : null
  }));
}
