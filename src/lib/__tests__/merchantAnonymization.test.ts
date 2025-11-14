import { describe, it, expect } from 'vitest';
import {
  isSensitiveCategory,
  getDisplayMerchantName,
  anonymizeTransactionsForExport
} from '../merchantAnonymization';

describe('merchantAnonymization', () => {
  describe('isSensitiveCategory', () => {
    it('should identify sensitive medical categories', () => {
      expect(isSensitiveCategory('medical')).toBe(true);
      expect(isSensitiveCategory('healthcare')).toBe(true);
      expect(isSensitiveCategory('hospital')).toBe(true);
      expect(isSensitiveCategory('pharmacy')).toBe(true);
      expect(isSensitiveCategory('mental_health')).toBe(true);
    });

    it('should identify sensitive adult/gambling categories', () => {
      expect(isSensitiveCategory('adult_entertainment')).toBe(true);
      expect(isSensitiveCategory('gambling')).toBe(true);
      expect(isSensitiveCategory('casino')).toBe(true);
      expect(isSensitiveCategory('betting')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isSensitiveCategory('MEDICAL')).toBe(true);
      expect(isSensitiveCategory('MeDiCaL')).toBe(true);
    });

    it('should handle null/undefined', () => {
      expect(isSensitiveCategory(null)).toBe(false);
      expect(isSensitiveCategory(undefined as any)).toBe(false);
    });

    it('should return false for non-sensitive categories', () => {
      expect(isSensitiveCategory('groceries')).toBe(false);
      expect(isSensitiveCategory('dining')).toBe(false);
      expect(isSensitiveCategory('travel')).toBe(false);
    });
  });

  describe('getDisplayMerchantName', () => {
    it('should return real name for admin views', () => {
      expect(
        getDisplayMerchantName('Apollo Hospital', 'medical', null, true)
      ).toBe('Apollo Hospital');
    });

    it('should anonymize sensitive merchant names for user views', () => {
      expect(
        getDisplayMerchantName('Apollo Hospital', 'medical', null, false)
      ).toBe('Medical Services');

      expect(
        getDisplayMerchantName('Max Healthcare', 'healthcare', null, false)
      ).toBe('Healthcare Provider');

      expect(
        getDisplayMerchantName('Fortis Hospital', 'hospital', null, false)
      ).toBe('Hospital');
    });

    it('should check subcategory for sensitivity', () => {
      expect(
        getDisplayMerchantName('Generic Store', 'retail', 'pharmacy', false)
      ).toBe('Pharmacy');
    });

    it('should return original name for non-sensitive categories', () => {
      expect(
        getDisplayMerchantName('Swiggy', 'dining', null, false)
      ).toBe('Swiggy');

      expect(
        getDisplayMerchantName('Amazon', 'shopping', null, false)
      ).toBe('Amazon');
    });

    it('should use fallback label for unknown sensitive categories', () => {
      expect(
        getDisplayMerchantName('Test Merchant', 'counseling', null, false)
      ).toBe('Professional Services');
    });
  });

  describe('anonymizeTransactionsForExport', () => {
    const sampleTransactions = [
      {
        id: '1',
        merchant_raw: 'Apollo Hospital',
        merchant_normalized: 'APOLLO HOSPITAL',
        merchant_canonical: 'Apollo Hospitals',
        category: 'medical',
        subcategory: null,
        amount_minor: 50000
      },
      {
        id: '2',
        merchant_raw: 'Swiggy',
        merchant_normalized: 'SWIGGY',
        merchant_canonical: 'Swiggy',
        category: 'dining',
        subcategory: null,
        amount_minor: 35000
      }
    ];

    it('should anonymize sensitive transactions for user export', () => {
      const result = anonymizeTransactionsForExport(sampleTransactions, false);

      expect(result[0].merchant_raw).toBe('Medical Services');
      expect(result[0].merchant_normalized).toBe('Medical Services');
      expect(result[0].merchant_canonical).toBe('Medical Services');

      expect(result[1].merchant_raw).toBe('Swiggy');
      expect(result[1].merchant_normalized).toBe('SWIGGY');
      expect(result[1].merchant_canonical).toBe('Swiggy');
    });

    it('should preserve real names for admin export', () => {
      const result = anonymizeTransactionsForExport(sampleTransactions, true);

      expect(result[0].merchant_raw).toBe('Apollo Hospital');
      expect(result[0].merchant_normalized).toBe('APOLLO HOSPITAL');
      expect(result[0].merchant_canonical).toBe('Apollo Hospitals');

      expect(result[1].merchant_raw).toBe('Swiggy');
      expect(result[1].merchant_normalized).toBe('SWIGGY');
    });

    it('should handle null merchant_canonical', () => {
      const txn = [{
        merchant_raw: 'Apollo',
        merchant_normalized: 'APOLLO',
        merchant_canonical: null,
        category: 'medical',
        subcategory: null
      }];

      const result = anonymizeTransactionsForExport(txn, false);
      expect(result[0].merchant_canonical).toBeNull();
    });
  });
});
