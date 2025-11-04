// Phase 1: Stable transaction ID generation

/**
 * Generates a stable transaction ID using SHA-256 hash
 * Format: sha256(user_id|batch_id|posted_date|amount_minor|normalized_merchant|line_number)
 */
export async function generateTransactionId(params: {
  userId: string;
  batchId: string;
  postedDate: string;
  amountMinor: number;
  normalizedMerchant: string;
  lineNumber: number;
}): Promise<string> {
  const { userId, batchId, postedDate, amountMinor, normalizedMerchant, lineNumber } = params;
  
  // Create composite key
  const composite = `${userId}|${batchId}|${postedDate}|${amountMinor}|${normalizedMerchant}|${lineNumber}`;
  
  // Generate SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(composite);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `txn_${hashHex}`;
}

/**
 * Generates a transaction hash for deduplication
 * Simplified version without user_id and batch_id for cross-batch dedup
 */
export async function generateTransactionHash(params: {
  postedDate: string;
  amountMinor: number;
  normalizedMerchant: string;
}): Promise<string> {
  const { postedDate, amountMinor, normalizedMerchant } = params;
  
  const composite = `${postedDate}|${amountMinor}|${normalizedMerchant}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(composite);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
