import Papa from 'papaparse';
import { sanitizeFormulaInjection } from '../import/csvParser.js';

/**
 * Generates sanitized CSV string from transaction documents (DEC-006)
 * @param {Array<Object>} transactions
 * @returns {string} Sanitized CSV string
 */
export function exportTransactionsToCsv(transactions) {
  const data = transactions.map((t) => {
    const formattedDate = new Date(t.transactionDate).toISOString().split('T')[0];
    const amountRupees = ((t.amountMinor || 0) / 100).toFixed(2);

    let accountName = 'N/A';
    if (t.type === 'transfer') {
      const from = t.fromAccountId?.name || 'Account A';
      const to = t.toAccountId?.name || 'Account B';
      accountName = `${from} -> ${to}`;
    } else {
      accountName = t.accountId?.name || 'N/A';
    }

    const categoryName = t.categoryId?.name || (t.type === 'transfer' ? 'Transfer' : 'Uncategorized');

    return {
      Date: formattedDate,
      Type: t.type.toUpperCase(),
      Description: sanitizeFormulaInjection(t.description),
      Amount: amountRupees,
      Currency: t.currency || 'INR',
      Account: sanitizeFormulaInjection(accountName),
      Category: sanitizeFormulaInjection(categoryName),
      PaymentMethod: t.paymentMethod || 'other',
      Notes: sanitizeFormulaInjection(t.notes || ''),
      Source: t.source || 'manual',
    };
  });

  return Papa.unparse(data, {
    quotes: true,
  });
}
