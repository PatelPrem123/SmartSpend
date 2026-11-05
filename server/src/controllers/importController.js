import { Account } from '../models/Account.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { ImportBatch } from '../models/ImportBatch.js';
import { Notification } from '../models/Notification.js';
import { TRANSACTION_TYPES, TRANSACTION_SOURCES } from '../config/constants.js';
import { parseAndPreviewCsv } from '../services/import/csvParser.js';
import { exportTransactionsToCsv } from '../services/export/csvExporter.js';
import { evaluateBudgetsForUser } from '../services/budget/budgetEvaluator.js';

/**
 * Preview uploaded bank statement CSV with formula sanitization & MD5 deduplication
 * POST /api/v1/imports/csv/preview
 */
export async function previewCsv(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a valid CSV bank statement file',
      });
    }

    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Target accountId is required for bank statement preview',
      });
    }

    // Verify account ownership (BOLA Defense)
    const account = await Account.findOne({
      _id: accountId,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Target account not found or access unauthorized',
      });
    }

    let customMapping = null;
    if (req.body.mapping) {
      try {
        customMapping =
          typeof req.body.mapping === 'string'
            ? JSON.parse(req.body.mapping)
            : req.body.mapping;
      } catch (e) {
        // Fall back to auto-detection
      }
    }

    const preview = await parseAndPreviewCsv(
      req.file.buffer,
      req.user._id,
      accountId,
      customMapping
    );

    res.status(200).json({
      success: true,
      filename: req.file.originalname,
      fileSize: req.file.size,
      accountId,
      accountName: account.name,
      preview,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Confirm and commit valid bank statement transactions into the financial ledger
 * POST /api/v1/imports/csv/confirm
 */
export async function confirmCsv(req, res, next) {
  try {
    const { accountId, filename, rows, skipDuplicates = true } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'accountId is required',
      });
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Rows array is required to commit import',
      });
    }

    // Verify account ownership (BOLA Defense)
    const account = await Account.findOne({
      _id: accountId,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Target account not found or access unauthorized',
      });
    }

    // Fetch user categories for category matching
    const userCategories = await Category.find({ userId: req.user._id });
    const categoryLookup = new Map();
    userCategories.forEach((cat) => {
      categoryLookup.set(cat.name.toLowerCase(), cat._id);
    });

    // Create pending ImportBatch
    const batch = await ImportBatch.create({
      userId: req.user._id,
      accountId,
      filename: filename || 'bank-statement.csv',
      totalRows: rows.length,
      status: 'pending',
    });

    let importedCount = 0;
    let skippedCount = 0;
    let totalIncomeMinor = 0;
    let totalExpenseMinor = 0;
    const transactionsToInsert = [];

    for (const row of rows) {
      // Skip invalid rows
      if (!row.isValid) {
        skippedCount++;
        continue;
      }

      // Skip duplicate rows if skipDuplicates is true (DEC-006)
      if (skipDuplicates && row.isDuplicate) {
        skippedCount++;
        continue;
      }

      // Match category if text matches
      let matchedCategoryId = null;
      if (row.category) {
        const cleanCatName = String(row.category).toLowerCase().replace(/^'/, '').trim();
        matchedCategoryId = categoryLookup.get(cleanCatName) || null;
      }

      const txDate = new Date(row.date);
      const isIncome = row.type === TRANSACTION_TYPES.INCOME;

      if (isIncome) {
        totalIncomeMinor += row.amountMinor;
      } else {
        totalExpenseMinor += row.amountMinor;
      }

      transactionsToInsert.push({
        userId: req.user._id,
        type: row.type || TRANSACTION_TYPES.EXPENSE,
        amountMinor: row.amountMinor,
        currency: 'INR',
        accountId,
        categoryId: matchedCategoryId,
        transactionDate: isNaN(txDate.getTime()) ? new Date() : txDate,
        description: row.description || 'Imported Transaction',
        notes: `Imported via statement batch #${batch._id}`,
        paymentMethod: 'other',
        source: TRANSACTION_SOURCES.CSV_IMPORT,
        importBatchId: batch._id,
      });

      importedCount++;
    }

    // Bulk insert transactions
    if (transactionsToInsert.length > 0) {
      await Transaction.insertMany(transactionsToInsert);

      // Mutate account balance atomically: +income -expense
      const netDelta = totalIncomeMinor - totalExpenseMinor;
      await Account.updateOne(
        { _id: accountId },
        { $inc: { currentBalanceMinor: netDelta } }
      );

      // Trigger budget evaluation if expenses were imported
      if (totalExpenseMinor > 0) {
        await evaluateBudgetsForUser(req.user._id).catch(() => {});
      }
    }

    // Finalize batch
    batch.importedCount = importedCount;
    batch.skippedCount = skippedCount;
    batch.totalIncomeMinor = totalIncomeMinor;
    batch.totalExpenseMinor = totalExpenseMinor;
    batch.status = 'completed';
    await batch.save();

    // Create in-app audit notification
    await Notification.create({
      userId: req.user._id,
      title: 'Bank Statement Import Complete',
      message: `Successfully imported ${importedCount} transactions into ${account.name}. (${skippedCount} duplicates/invalid rows skipped).`,
      type: 'system',
      severity: 'info',
      relatedId: batch._id,
    });

    res.status(201).json({
      success: true,
      batch,
      importedCount,
      skippedCount,
      totalIncomeMinor,
      totalExpenseMinor,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all import batches for authenticated user
 * GET /api/v1/imports
 */
export async function getImportBatches(req, res, next) {
  try {
    const batches = await ImportBatch.find({ userId: req.user._id })
      .populate('accountId', 'name accountType color')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      batches,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export transactions to sanitized CSV (DEC-006)
 * GET /api/v1/imports/csv/export
 */
export async function exportCsv(req, res, next) {
  try {
    const filter = { userId: req.user._id };

    if (req.query.accountId) {
      filter.$or = [{ accountId: req.query.accountId }, { fromAccountId: req.query.accountId }];
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.transactionDate = {};
      if (req.query.startDate) filter.transactionDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.transactionDate.$lte = new Date(req.query.endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('accountId', 'name')
      .populate('fromAccountId', 'name')
      .populate('toAccountId', 'name')
      .populate('categoryId', 'name')
      .sort({ transactionDate: -1 });

    const csvData = exportTransactionsToCsv(transactions);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="smartspend-transactions.csv"');
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
}
