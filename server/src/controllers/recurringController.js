import { RecurringRule } from '../models/RecurringRule.js';
import { Account } from '../models/Account.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import {
  createRecurringRuleSchema,
  updateRecurringRuleSchema,
} from '../validators/recurringValidator.js';
import {
  processRecurringTransactions,
  calculateNextOccurrence,
} from '../services/recurring/recurringScheduler.js';

/**
 * Create a new recurring transaction rule
 * POST /api/v1/recurring
 */
export async function createRecurringRule(req, res, next) {
  try {
    const validatedData = createRecurringRuleSchema.parse(req.body);

    // Verify account ownership (BOLA Defense)
    if (validatedData.accountId) {
      const account = await Account.findOne({
        _id: validatedData.accountId,
        userId: req.user._id,
      });
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found or access unauthorized',
        });
      }
    }

    if (validatedData.fromAccountId && validatedData.toAccountId) {
      const [fromAcc, toAcc] = await Promise.all([
        Account.findOne({ _id: validatedData.fromAccountId, userId: req.user._id }),
        Account.findOne({ _id: validatedData.toAccountId, userId: req.user._id }),
      ]);
      if (!fromAcc || !toAcc) {
        return res.status(404).json({
          success: false,
          error: 'Transfer accounts not found or access unauthorized',
        });
      }
    }

    if (validatedData.categoryId) {
      const category = await Category.findOne({
        _id: validatedData.categoryId,
        userId: req.user._id,
      });
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found or access unauthorized',
        });
      }
    }

    const startDate = validatedData.startDate ? new Date(validatedData.startDate) : new Date();

    const rule = await RecurringRule.create({
      userId: req.user._id,
      title: validatedData.title,
      type: validatedData.type,
      amountMinor: validatedData.amountMinor,
      accountId: validatedData.accountId || null,
      fromAccountId: validatedData.fromAccountId || null,
      toAccountId: validatedData.toAccountId || null,
      categoryId: validatedData.categoryId || null,
      frequency: validatedData.frequency,
      startDate,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      nextRunAt: startDate,
      paymentMethod: validatedData.paymentMethod || 'upi',
      description: validatedData.description || '',
      notes: validatedData.notes || '',
    });

    const populated = await RecurringRule.findById(rule._id)
      .populate('accountId', 'name accountType color')
      .populate('fromAccountId', 'name accountType color')
      .populate('toAccountId', 'name accountType color')
      .populate('categoryId', 'name type icon color');

    res.status(201).json({
      success: true,
      rule: populated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all recurring rules for user
 * GET /api/v1/recurring
 */
export async function getRecurringRules(req, res, next) {
  try {
    const rules = await RecurringRule.find({ userId: req.user._id })
      .populate('accountId', 'name accountType color')
      .populate('fromAccountId', 'name accountType color')
      .populate('toAccountId', 'name accountType color')
      .populate('categoryId', 'name type icon color')
      .sort({ nextRunAt: 1 });

    res.status(200).json({
      success: true,
      rules,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single recurring rule by ID
 * GET /api/v1/recurring/:id
 */
export async function getRecurringRuleById(req, res, next) {
  try {
    const rule = await RecurringRule.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('accountId', 'name accountType color')
      .populate('fromAccountId', 'name accountType color')
      .populate('toAccountId', 'name accountType color')
      .populate('categoryId', 'name type icon color');

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Recurring rule not found or access unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      rule,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update recurring rule (e.g. toggle isActive, update amount/frequency)
 * PATCH /api/v1/recurring/:id
 */
export async function updateRecurringRule(req, res, next) {
  try {
    const validatedData = updateRecurringRuleSchema.parse(req.body);

    const rule = await RecurringRule.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Recurring rule not found or access unauthorized',
      });
    }

    if (validatedData.title !== undefined) rule.title = validatedData.title;
    if (validatedData.amountMinor !== undefined) rule.amountMinor = validatedData.amountMinor;
    if (validatedData.frequency !== undefined) {
      rule.frequency = validatedData.frequency;
      rule.nextRunAt = calculateNextOccurrence(rule.lastRunAt || new Date(), rule.frequency);
    }
    if (validatedData.isActive !== undefined) rule.isActive = validatedData.isActive;
    if (validatedData.endDate !== undefined) {
      rule.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    }
    if (validatedData.paymentMethod !== undefined) rule.paymentMethod = validatedData.paymentMethod;
    if (validatedData.description !== undefined) rule.description = validatedData.description;
    if (validatedData.notes !== undefined) rule.notes = validatedData.notes;

    await rule.save();

    const populated = await RecurringRule.findById(rule._id)
      .populate('accountId', 'name accountType color')
      .populate('fromAccountId', 'name accountType color')
      .populate('toAccountId', 'name accountType color')
      .populate('categoryId', 'name type icon color');

    res.status(200).json({
      success: true,
      rule: populated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete recurring rule
 * DELETE /api/v1/recurring/:id
 */
export async function deleteRecurringRule(req, res, next) {
  try {
    const rule = await RecurringRule.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Recurring rule not found or access unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recurring rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Manually trigger daemon sweep execution
 * POST /api/v1/recurring/sweep
 */
export async function triggerManualSweep(req, res, next) {
  try {
    const result = await processRecurringTransactions();
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all ledger transactions generated by this recurring rule
 * GET /api/v1/recurring/:id/transactions
 */
export async function getRuleTransactionHistory(req, res, next) {
  try {
    const transactions = await Transaction.find({
      recurrenceRuleId: req.params.id,
      userId: req.user._id,
    })
      .populate('accountId', 'name accountType color')
      .populate('categoryId', 'name type icon color')
      .sort({ transactionDate: -1 });

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    next(error);
  }
}
