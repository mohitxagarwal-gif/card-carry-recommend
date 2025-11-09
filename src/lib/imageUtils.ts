/**
 * Utility functions for card image handling and matching
 */

/**
 * Normalize a string for fuzzy matching
 * Removes spaces, special chars, converts to lowercase
 */
export const normalizeForMatching = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Match an image filename to a card_id
 * Supports various filename formats:
 * - exact match: hdfc-regalia.png → hdfc-regalia
 * - fuzzy match: HDFC Regalia Gold.jpg → hdfc-regalia-gold
 * - partial match: hdfc_regalia.png → hdfc-regalia
 */
export const matchImageToCardId = (
  filename: string,
  cardIds: string[]
): string | null => {
  // Remove extension
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
  
  // Try exact match first
  const exactMatch = cardIds.find(id => id === nameWithoutExt);
  if (exactMatch) return exactMatch;
  
  // Normalize the filename
  const normalizedFilename = normalizeForMatching(nameWithoutExt);
  
  // Try normalized match
  const normalizedMatch = cardIds.find(id => 
    normalizeForMatching(id) === normalizedFilename
  );
  if (normalizedMatch) return normalizedMatch;
  
  // Try partial match (filename contains card_id or vice versa)
  const partialMatch = cardIds.find(id => {
    const normalizedId = normalizeForMatching(id);
    return normalizedFilename.includes(normalizedId) || 
           normalizedId.includes(normalizedFilename);
  });
  
  return partialMatch || null;
};

/**
 * Get card image URL with fallback strategy
 */
export const getCardImageUrl = (card: { 
  image_url?: string; 
  issuer: string; 
  network: string;
}): string | null => {
  if (card.image_url) return card.image_url;
  // Return null for fallback to gradient or placeholder in components
  return null;
};
