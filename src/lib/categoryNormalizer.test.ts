import { describe, it, expect } from 'vitest';
import { normalizeToCanonical, convertSpendSplitToShares, CANONICAL_CATEGORIES } from './categoryNormalizer';

describe('categoryNormalizer', () => {
  describe('normalizeToCanonical', () => {
    it('should map QuickSpendingHints categories correctly', () => {
      expect(normalizeToCanonical('Online Shopping')).toBe('shopping_online');
      expect(normalizeToCanonical('Food Delivery')).toBe('food_dining');
      expect(normalizeToCanonical('Dining Out')).toBe('food_dining');
      expect(normalizeToCanonical('Groceries')).toBe('groceries');
    });
    
    it('should map SpendingSliders categories correctly', () => {
      expect(normalizeToCanonical('online')).toBe('shopping_online');
      expect(normalizeToCanonical('dining')).toBe('food_dining');
      expect(normalizeToCanonical('cabsFuel')).toBe('fuel');
      expect(normalizeToCanonical('billsUtilities')).toBe('bills_utilities');
    });
    
    it('should map transaction categories correctly', () => {
      expect(normalizeToCanonical('Dining')).toBe('food_dining');
      expect(normalizeToCanonical('Grocery')).toBe('groceries');
      expect(normalizeToCanonical('Fuel')).toBe('fuel');
      expect(normalizeToCanonical('Travel')).toBe('travel');
    });
    
    it('should handle case-insensitive matching', () => {
      expect(normalizeToCanonical('DINING')).toBe('food_dining');
      expect(normalizeToCanonical('groceries')).toBe('groceries');
      expect(normalizeToCanonical('Online Shopping')).toBe('shopping_online');
    });
    
    it('should return "other" for unmapped categories', () => {
      expect(normalizeToCanonical('unknown_category')).toBe('other');
      expect(normalizeToCanonical('')).toBe('other');
      expect(normalizeToCanonical(null)).toBe('other');
      expect(normalizeToCanonical(undefined)).toBe('other');
    });
  });
  
  describe('convertSpendSplitToShares', () => {
    it('should convert percentages to fractions', () => {
      const input = {
        'Online Shopping': 40,
        'Dining': 30,
        'Groceries': 30
      };
      
      const result = convertSpendSplitToShares(input);
      
      expect(result['shopping_online_share']).toBeCloseTo(0.4, 2);
      expect(result['food_dining_share']).toBeCloseTo(0.3, 2);
      expect(result['groceries_share']).toBeCloseTo(0.3, 2);
    });
    
    it('should normalize to sum to 1.0', () => {
      const input = {
        'Online Shopping': 45,
        'Dining': 35,
        'Groceries': 20
      };
      
      const result = convertSpendSplitToShares(input);
      const sum = Object.values(result).reduce((a, b) => a + b, 0);
      
      expect(sum).toBeCloseTo(1.0, 2);
    });
    
    it('should handle already-normalized fractions', () => {
      const input = {
        'online': 0.4,
        'dining': 0.3,
        'groceries': 0.3
      };
      
      const result = convertSpendSplitToShares(input);
      
      expect(result['shopping_online_share']).toBeCloseTo(0.4, 2);
      expect(result['food_dining_share']).toBeCloseTo(0.3, 2);
    });
    
    it('should initialize all canonical categories', () => {
      const input = { 'Dining': 100 };
      const result = convertSpendSplitToShares(input);
      
      CANONICAL_CATEGORIES.forEach(cat => {
        expect(result).toHaveProperty(cat + '_share');
      });
    });
  });
});