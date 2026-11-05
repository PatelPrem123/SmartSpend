import { describe, it, expect } from 'vitest';
import {
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  isValidIntegerPaise,
  calculateNetCashFlow,
  calculateSavingsRate,
  calculateBudgetUtilization,
} from '../src/utils/money.js';

describe('Financial Calculation & Integer Paise Precision (DEC-002)', () => {
  describe('rupeesToPaise', () => {
    it('correctly converts decimal rupees to integer paise without floating-point errors', () => {
      expect(rupeesToPaise(1.5)).toBe(150);
      expect(rupeesToPaise(1250.5)).toBe(125050);
      expect(rupeesToPaise(0.25)).toBe(25);
      expect(rupeesToPaise('99.99')).toBe(9999);
      expect(rupeesToPaise(1000000)).toBe(100000000); // 10 Lakh INR
    });

    it('throws an error for non-numeric inputs', () => {
      expect(() => rupeesToPaise('invalid')).toThrow();
    });
  });

  describe('paiseToRupees', () => {
    it('correctly converts integer paise to rupee decimal for presentation', () => {
      expect(paiseToRupees(150)).toBe(1.5);
      expect(paiseToRupees(125050)).toBe(1250.5);
      expect(paiseToRupees(25)).toBe(0.25);
    });

    it('rejects non-integer values', () => {
      expect(() => paiseToRupees(150.55)).toThrow();
    });
  });

  describe('formatINR', () => {
    it('formats integer paise into standard Indian Rupee notation', () => {
      expect(formatINR(125050)).toBe('₹1,250.50');
      expect(formatINR(10000000)).toBe('₹1,00,000.00'); // 1 Lakh INR
      expect(formatINR(1000000000)).toBe('₹1,00,00,000.00'); // 1 Crore INR
      expect(formatINR(0)).toBe('₹0.00');
    });

    it('allows formatting without the rupee currency symbol', () => {
      expect(formatINR(125050, false)).toBe('1,250.50');
    });
  });

  describe('isValidIntegerPaise', () => {
    it('validates strictly positive integers', () => {
      expect(isValidIntegerPaise(100)).toBe(true);
      expect(isValidIntegerPaise(1)).toBe(true);
      expect(isValidIntegerPaise(0)).toBe(false);
      expect(isValidIntegerPaise(-50)).toBe(false);
      expect(isValidIntegerPaise(100.5)).toBe(false);
      expect(isValidIntegerPaise('100')).toBe(false);
    });
  });

  describe('calculateNetCashFlow (DEC-003, DEC-010)', () => {
    it('calculates net cash flow accurately as income minus expenses', () => {
      const income = 15000000; // ₹1,50,000.00
      const expense = 8500000; // ₹85,000.00
      expect(calculateNetCashFlow(income, expense)).toBe(6500000); // ₹65,000.00
    });

    it('handles negative net cash flow when expenses exceed income', () => {
      const income = 5000000; // ₹50,000.00
      const expense = 7000000; // ₹70,000.00
      expect(calculateNetCashFlow(income, expense)).toBe(-2000000); // -₹20,000.00
    });
  });

  describe('calculateSavingsRate with Zero-Income Guard (DEC-010)', () => {
    it('calculates savings percentage correctly', () => {
      const income = 10000000; // ₹1,00,000.00
      const expense = 4000000; // ₹40,000.00
      expect(calculateSavingsRate(income, expense)).toBe(60); // 60%
    });

    it('guards against division-by-zero when income is zero', () => {
      expect(calculateSavingsRate(0, 500000)).toBe(0);
      expect(calculateSavingsRate(null, 500000)).toBe(0);
      expect(calculateSavingsRate(-100, 500000)).toBe(0);
    });
  });

  describe('calculateBudgetUtilization', () => {
    it('computes utilization percentage', () => {
      expect(calculateBudgetUtilization(750000, 1000000)).toBe(75);
      expect(calculateBudgetUtilization(1100000, 1000000)).toBe(110);
    });

    it('returns 0 when budget cap is zero or negative', () => {
      expect(calculateBudgetUtilization(50000, 0)).toBe(0);
    });
  });
});
