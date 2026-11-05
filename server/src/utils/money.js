/**
 * SmartSpend Monetary Formulation & Integer Currency Utilities
 * All monetary amounts are handled exclusively in integer minor units (paise for INR).
 * 1 INR = 100 paise.
 */

/**
 * Converts a rupee decimal or number into integer paise.
 * Safely rounds to eliminate standard IEEE 754 floating-point artifacts.
 * @param {number|string} rupees
 * @returns {number} Integer paise
 */
export function rupeesToPaise(rupees) {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(parsed)) {
    throw new Error('Invalid monetary amount provided');
  }
  return Math.round(parsed * 100);
}

/**
 * Converts integer paise into rupee decimal value.
 * Strictly intended for presentation boundary conversions.
 * @param {number} paise
 * @returns {number}
 */
export function paiseToRupees(paise) {
  if (!Number.isInteger(paise)) {
    throw new Error('Paise value must be an integer');
  }
  return paise / 100;
}

/**
 * Formats integer paise into localized Indian Currency format string (e.g., ₹1,25,050.50).
 * @param {number} paise
 * @param {boolean} includeSymbol - Whether to prepend the ₹ symbol
 * @returns {string} Localized INR string
 */
export function formatINR(paise, includeSymbol = true) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return includeSymbol ? '₹0.00' : '0.00';
  }
  const rupees = paise / 100;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Validates that an amount is a valid positive integer minor unit.
 * @param {any} value
 * @returns {boolean}
 */
export function isValidIntegerPaise(value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Calculates Net Cash Flow = Total Income - Total Expenses.
 * Transfers are strictly excluded.
 * @param {number} totalIncomeMinor
 * @param {number} totalExpenseMinor
 * @returns {number} Net Cash Flow in paise
 */
export function calculateNetCashFlow(totalIncomeMinor, totalExpenseMinor) {
  const income = Number.isInteger(totalIncomeMinor) ? totalIncomeMinor : 0;
  const expense = Number.isInteger(totalExpenseMinor) ? totalExpenseMinor : 0;
  return income - expense;
}

/**
 * Calculates Savings Rate % with Zero-Income Guard.
 * Savings Rate = ((Total Income - Total Expenses) / Total Income) * 100
 * If Total Income is 0, returns 0 rather than NaN or -Infinity.
 * @param {number} totalIncomeMinor
 * @param {number} totalExpenseMinor
 * @returns {number} Rounded percentage (0 - 100) or negative if overspent
 */
export function calculateSavingsRate(totalIncomeMinor, totalExpenseMinor) {
  if (!totalIncomeMinor || totalIncomeMinor <= 0) {
    return 0;
  }
  const netSavings = totalIncomeMinor - totalExpenseMinor;
  const rate = (netSavings / totalIncomeMinor) * 100;
  return Math.round(rate * 10) / 10;
}

/**
 * Calculates Budget Utilization % = (Spent / Budget) * 100
 * @param {number} spentMinor
 * @param {number} budgetMinor
 * @returns {number}
 */
export function calculateBudgetUtilization(spentMinor, budgetMinor) {
  if (!budgetMinor || budgetMinor <= 0) {
    return 0;
  }
  const utilization = (spentMinor / budgetMinor) * 100;
  return Math.round(utilization * 10) / 10;
}
