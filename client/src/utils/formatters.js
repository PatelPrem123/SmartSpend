/**
 * SmartSpend Client Monetary & Date Formatters
 */

/**
 * Format integer paise into localized Indian Currency format (e.g. ₹1,25,050.00)
 * @param {number} paise
 * @param {boolean} includeSymbol
 * @returns {string}
 */
export function formatCurrency(paise, includeSymbol = true) {
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
 * Converts decimal rupees from user input into integer paise
 * @param {string|number} rupees
 * @returns {number}
 */
export function parseRupeesToPaise(rupees) {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

/**
 * Format ISO date string into readable Indian format (e.g. 05 Nov 2026)
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date with time (e.g. 05 Nov 2026, 04:30 PM)
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get budget progress bar color according to SmartSpend tiers:
 * Safe: 0 - 74% (Emerald)
 * Warning: 75 - 89% (Amber)
 * Critical: 90 - 99% (Orange)
 * Exceeded: >= 100% (Red)
 * @param {number} percentage
 * @returns {string} Tailwind CSS color classes
 */
export function getBudgetTierColor(percentage) {
  if (percentage >= 100) return 'bg-rose-500 text-rose-600 dark:text-rose-400';
  if (percentage >= 90) return 'bg-amber-500 text-amber-600 dark:text-amber-400';
  if (percentage >= 75) return 'bg-yellow-500 text-yellow-600 dark:text-yellow-400';
  return 'bg-emerald-500 text-emerald-600 dark:text-emerald-400';
}
