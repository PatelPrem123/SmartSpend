import Papa from 'papaparse';
import crypto from 'crypto';
import { Transaction } from '../../models/Transaction.js';
import { TRANSACTION_TYPES } from '../../config/constants.js';

/**
 * Sanitizes CSV cell text to defend against CSV Formula Injection / Macro Exploits (DEC-006)
 * Prepends a single quote (') if string starts with '=', '+', '-', or '@'
 * @param {any} value
 * @returns {any}
 */
export function sanitizeFormulaInjection(value) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  // Check if string starts with dangerous spreadsheet formula characters
  if (/^[=+\-@]/.test(trimmed)) {
    // If it's a valid numeric float/integer (e.g. "-125.50" or "+500"), keep as is for numeric conversion
    if (/^[+\-]?\d+(\.\d+)?$/.test(trimmed)) {
      return trimmed;
    }
    // Prepend single quote to neutralize formula execution in Excel/Sheets
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Generates MD5 fingerprint over date + amountMinor + accountId + normalized description (DEC-006)
 * @param {Date|string} date
 * @param {number} amountMinor
 * @param {string} accountId
 * @param {string} description
 * @returns {string} MD5 hash hex string
 */
export function generateRowFingerprint(date, amountMinor, accountId, description) {
  const dateObj = new Date(date);
  const normalizedDate = isNaN(dateObj.getTime())
    ? 'invalid-date'
    : dateObj.toISOString().split('T')[0];
  const normalizedDesc = (description || '').trim().toLowerCase();
  const payload = `${normalizedDate}|${amountMinor}|${accountId}|${normalizedDesc}`;
  return crypto.createHash('md5').update(payload).digest('hex');
}

/**
 * Parses diverse human date formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
 * @param {string} rawDate
 * @returns {Date|null}
 */
export function parseDateString(rawDate) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();

  // 1. ISO format: YYYY-MM-DD or ISO timestamp
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Format with slashes or dashes: DD/MM/YYYY or DD-MM-YYYY
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // If year is 2 digits e.g. 24 -> 2024
    if (year < 100) year += 2000;

    // Check if it's DD/MM/YYYY
    if (day > 0 && day <= 31 && month > 0 && month <= 12 && year >= 1970 && year <= 2100) {
      const d = new Date(year, month - 1, day, 12, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }

    // Fallback: MM/DD/YYYY
    const dAlt = new Date(year, day - 1, month, 12, 0, 0);
    if (!isNaN(dAlt.getTime())) return dAlt;
  }

  const standard = new Date(str);
  return isNaN(standard.getTime()) ? null : standard;
}

/**
 * Cleans currency strings e.g. "₹1,250.50", "($50.00)", "-1,000" into numeric minor paise
 * @param {string|number} rawAmount
 * @returns {{ amountMinor: number, isNegative: boolean } | null}
 */
export function parseAmountMinor(rawAmount) {
  if (rawAmount === undefined || rawAmount === null || rawAmount === '') return null;

  if (typeof rawAmount === 'number') {
    const isNegative = rawAmount < 0;
    const abs = Math.abs(rawAmount);
    return {
      amountMinor: Math.round(abs * 100),
      isNegative,
    };
  }

  let str = String(rawAmount).trim();

  // Accounting negative notation: (1,250.50) -> -1250.50
  let isNegative = false;
  if (/^\(.*\)$/.test(str)) {
    isNegative = true;
    str = str.replace(/[()]/g, '');
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1);
  } else if (str.startsWith('+')) {
    str = str.substring(1);
  }

  // Remove currency symbols, commas, and whitespace
  const cleanNumStr = str.replace(/[₹$,\s]/g, '');
  const parsedFloat = parseFloat(cleanNumStr);

  if (isNaN(parsedFloat) || parsedFloat < 0) {
    return null;
  }

  return {
    amountMinor: Math.round(parsedFloat * 100),
    isNegative,
  };
}

/**
 * Automatically detects column mapping from CSV header keys
 * @param {Array<string>} headers
 * @returns {Object} Detected column keys
 */
export function detectColumnMapping(headers) {
  const mapping = {
    date: null,
    description: null,
    amount: null,
    debit: null,
    credit: null,
    category: null,
  };

  const lowerHeaders = headers.map((h) => ({ original: h, lower: h.trim().toLowerCase() }));

  for (const item of lowerHeaders) {
    const { original, lower } = item;

    if (!mapping.date && /date|txn.?date|booking|value.?date/.test(lower)) {
      mapping.date = original;
    } else if (
      !mapping.description &&
      /description|narration|particulars|details|remarks|payee|merchant/.test(lower)
    ) {
      mapping.description = original;
    } else if (!mapping.debit && /debit|dr|withdrawal|spent/.test(lower)) {
      mapping.debit = original;
    } else if (!mapping.credit && /credit|cr|deposit|received/.test(lower)) {
      mapping.credit = original;
    } else if (!mapping.amount && /amount|total|net/.test(lower)) {
      mapping.amount = original;
    } else if (!mapping.category && /category|tag|type/.test(lower)) {
      mapping.category = original;
    }
  }

  return mapping;
}

/**
 * Parses and verifies uploaded bank statement CSV buffer with formula sanitization & MD5 deduplication
 * @param {Buffer|string} fileContent
 * @param {string} userId
 * @param {string} accountId
 * @param {Object} [customMapping]
 * @returns {Promise<Object>}
 */
export async function parseAndPreviewCsv(fileContent, userId, accountId, customMapping = null) {
  const csvString = Buffer.isBuffer(fileContent) ? fileContent.toString('utf-8') : fileContent;

  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });

  const headers = parsed.meta.fields || [];
  const mapping = customMapping || detectColumnMapping(headers);

  // Pre-load user's existing transactions for this account to perform lightning-fast deduplication
  const existingTransactions = await Transaction.find({
    userId,
    accountId,
  }).select('transactionDate amountMinor description');

  // Build a fast lookup set of existing fingerprints
  const existingFingerprintSet = new Set();
  existingTransactions.forEach((tx) => {
    const fp = generateRowFingerprint(
      tx.transactionDate,
      tx.amountMinor,
      accountId,
      tx.description
    );
    existingFingerprintSet.add(fp);
  });

  const previewRows = [];
  let validCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let previewIncomeMinor = 0;
  let previewExpenseMinor = 0;

  for (let index = 0; index < parsed.data.length; index++) {
    const row = parsed.data[index];
    const rowNumber = index + 1;

    // 1. Extract and Sanitize Description (Formula Injection Defense DEC-006)
    const rawDesc = mapping.description ? row[mapping.description] : 'Bank Transaction';
    const sanitizedDesc = sanitizeFormulaInjection(rawDesc) || `Row ${rowNumber}`;

    // 2. Extract and Parse Date
    const rawDate = mapping.date ? row[mapping.date] : null;
    const parsedDate = parseDateString(rawDate);

    // 3. Extract and Parse Amount & Type
    let amountMinor = 0;
    let type = TRANSACTION_TYPES.EXPENSE;
    let isValidAmount = false;

    // Case A: Separate Debit and Credit columns
    if (mapping.debit && mapping.credit) {
      const debitParsed = parseAmountMinor(row[mapping.debit]);
      const creditParsed = parseAmountMinor(row[mapping.credit]);

      if (creditParsed && creditParsed.amountMinor > 0) {
        amountMinor = creditParsed.amountMinor;
        type = TRANSACTION_TYPES.INCOME;
        isValidAmount = true;
      } else if (debitParsed && debitParsed.amountMinor > 0) {
        amountMinor = debitParsed.amountMinor;
        type = TRANSACTION_TYPES.EXPENSE;
        isValidAmount = true;
      }
    }
    // Case B: Single Amount column
    else if (mapping.amount) {
      const singleParsed = parseAmountMinor(row[mapping.amount]);
      if (singleParsed && singleParsed.amountMinor > 0) {
        amountMinor = singleParsed.amountMinor;
        // Negative amount = Expense, Positive = Income
        type = singleParsed.isNegative ? TRANSACTION_TYPES.EXPENSE : TRANSACTION_TYPES.INCOME;
        isValidAmount = true;
      }
    }

    // Category if present
    const rawCategory = mapping.category ? row[mapping.category] : null;
    const sanitizedCategory = sanitizeFormulaInjection(rawCategory);

    // Validation Check
    let errorReason = null;
    if (!parsedDate) {
      errorReason = 'Invalid or missing transaction date';
    } else if (!isValidAmount || amountMinor <= 0) {
      errorReason = 'Invalid or missing transaction amount';
    }

    if (errorReason) {
      errorCount++;
      previewRows.push({
        rowNumber,
        date: rawDate,
        description: sanitizedDesc,
        amountMinor: 0,
        type: 'expense',
        category: sanitizedCategory,
        isValid: false,
        isDuplicate: false,
        error: errorReason,
      });
      continue;
    }

    // MD5 Fingerprint Check for Deduplication (DEC-006)
    const rowFingerprint = generateRowFingerprint(
      parsedDate,
      amountMinor,
      accountId,
      sanitizedDesc
    );
    const isDuplicate = existingFingerprintSet.has(rowFingerprint);

    if (isDuplicate) {
      duplicateCount++;
    } else {
      validCount++;
      if (type === TRANSACTION_TYPES.INCOME) {
        previewIncomeMinor += amountMinor;
      } else {
        previewExpenseMinor += amountMinor;
      }
    }

    previewRows.push({
      rowNumber,
      date: parsedDate.toISOString(),
      displayDate: parsedDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      description: sanitizedDesc,
      amountMinor,
      type,
      category: sanitizedCategory,
      fingerprint: rowFingerprint,
      isValid: true,
      isDuplicate,
      duplicateReason: isDuplicate ? 'Identical transaction found in your account ledger' : null,
    });
  }

  return {
    headers,
    suggestedMapping: mapping,
    totalRows: parsed.data.length,
    validCount,
    duplicateCount,
    errorCount,
    previewIncomeMinor,
    previewExpenseMinor,
    previewRows,
  };
}
