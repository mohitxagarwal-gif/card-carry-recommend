// Phase 4: Shared transaction inclusion rules

export interface Transaction {
  transactionType?: string;
  type?: string;
  amount?: number;
  category?: string;
  merchant?: string;
}

/**
 * Determines if a transaction should be included in spending calculations
 * Shared predicate used by Upload, Results, and Recommendations
 */
export function includeInSpending(transaction: Transaction): boolean {
  const txType = (transaction.transactionType || transaction.type || '').toLowerCase();
  const amount = transaction.amount || 0;
  
  // Exclude credits (refunds, income, reversals)
  if (txType === 'credit') {
    return false;
  }
  
  // Exclude zero or negative amounts
  if (amount <= 0) {
    return false;
  }
  
  // Exclude transfers (common patterns)
  const merchant = (transaction.merchant || '').toLowerCase();
  const transferPatterns = [
    'transfer',
    'wallet top',
    'paytm wallet',
    'phonepe wallet',
    'google pay',
    'upi transfer'
  ];
  
  if (transferPatterns.some(pattern => merchant.includes(pattern))) {
    return false;
  }
  
  // Exclude failed transactions (if indicated in merchant name)
  if (merchant.includes('failed') || merchant.includes('declined')) {
    return false;
  }
  
  // Include debit transactions
  return txType === 'debit';
}

/**
 * Determines if a transaction is a fee or interest charge
 * These are included in "avoidable charges" but excluded from discretionary spend
 */
export function isFeeOrInterest(transaction: Transaction): boolean {
  const merchant = (transaction.merchant || '').toLowerCase();
  const category = (transaction.category || '').toLowerCase();
  
  const feePatterns = [
    'late fee',
    'annual fee',
    'interest',
    'finance charge',
    'overlimit fee',
    'service charge'
  ];
  
  return feePatterns.some(pattern => 
    merchant.includes(pattern) || category.includes(pattern)
  );
}

/**
 * Calculates total spending from a transaction list
 */
export function calculateTotalSpending(transactions: Transaction[]): number {
  return transactions
    .filter(includeInSpending)
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
}

/**
 * Groups transactions by category with spending totals
 */
export function groupByCategory(transactions: Transaction[]): Record<string, number> {
  const groups: Record<string, number> = {};
  
  transactions
    .filter(includeInSpending)
    .forEach(tx => {
      const category = tx.category || 'Other';
      groups[category] = (groups[category] || 0) + (tx.amount || 0);
    });
  
  return groups;
}
