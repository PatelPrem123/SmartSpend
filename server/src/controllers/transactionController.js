import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { Category } from '../models/Category.js';
import {
  createTransactionSchema,
  createTransferSchema,
  updateTransactionSchema,
  queryTransactionsSchema,
} from '../validators/transactionValidator.js';
import { TRANSACTION_TYPES } from '../config/constants.js';
import { evaluateBudgetsForUser } from '../services/budget/budgetEvaluator.js';

/**
 * @desc    Get paginated transactions with multi-filters
 * @route   GET /api/v1/transactions
 * @access  Private
 */
export async function getTransactions(req, res, next) {
  try {
    const query = queryTransactionsSchema.parse(req.query);

    const filter = { userId: req.user._id };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.accountId) {
      filter.$or = [
        { accountId: query.accountId },
        { fromAccountId: query.accountId },
        { toAccountId: query.accountId },
      ];
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    if (query.startDate || query.endDate) {
      filter.transactionDate = {};
      if (query.startDate) {
        filter.transactionDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.transactionDate.$lte = new Date(query.endDate);
      }
    }

    if (query.search) {
      filter.description = { $regex: query.search.trim(), $options: 'i' };
    }

    const skip = (query.page - 1) * query.limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate('accountId', 'name accountType color')
        .populate('fromAccountId', 'name accountType color')
        .populate('toAccountId', 'name accountType color')
        .populate('categoryId', 'name type icon color'),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
      transactions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get single transaction by ID
 * @route   GET /api/v1/transactions/:id
 * @access  Private
 */
export async function getTransactionById(req, res, next) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('accountId', 'name accountType color')
      .populate('fromAccountId', 'name accountType color')
      .populate('toAccountId', 'name accountType color')
      .populate('categoryId', 'name type icon color');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create new Income or Expense transaction
 * @route   POST /api/v1/transactions
 * @access  Private
 */
export async function createTransaction(req, res, next) {
  try {
    const validatedData = createTransactionSchema.parse(req.body);

    // Verify account ownership (BOLA Defense)
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

    // Verify category ownership if provided
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

    const transaction = await Transaction.create({
      userId: req.user._id,
      type: validatedData.type,
      amountMinor: validatedData.amountMinor,
      accountId: validatedData.accountId,
      categoryId: validatedData.categoryId || null,
      transactionDate: validatedData.transactionDate,
      description: validatedData.description,
      notes: validatedData.notes,
      paymentMethod: validatedData.paymentMethod,
    });

    // Atomically mutate account balance (DEC-002, DEC-003)
    const balanceDelta =
      validatedData.type === TRANSACTION_TYPES.INCOME
        ? validatedData.amountMinor
        : -validatedData.amountMinor;

    await Account.updateOne(
      { _id: account._id },
      { $inc: { currentBalanceMinor: balanceDelta } }
    );

    const populated = await Transaction.findById(transaction._id)
      .populate('accountId', 'name accountType color')
      .populate('categoryId', 'name type icon color');

    // Trigger idempotent budget evaluation for expenses (DEC-004)
    if (validatedData.type === TRANSACTION_TYPES.EXPENSE) {
      await evaluateBudgetsForUser(req.user._id, validatedData.transactionDate);
    }

    res.status(201).json({
      success: true,
      transaction: populated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Execute atomic money transfer between two accounts (DEC-003)
 * @route   POST /api/v1/transactions/transfer
 * @access  Private
 */
export async function createTransfer(req, res, next) {
  try {
    const validatedData = createTransferSchema.parse(req.body);

    // Verify ownership of BOTH accounts (DEC-007 BOLA Defense)
    const [fromAccount, toAccount] = await Promise.all([
      Account.findOne({ _id: validatedData.fromAccountId, userId: req.user._id }),
      Account.findOne({ _id: validatedData.toAccountId, userId: req.user._id }),
    ]);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({
        success: false,
        error: 'One or both transfer accounts not found or access unauthorized',
      });
    }

    // Create single atomic transfer record
    const transaction = await Transaction.create({
      userId: req.user._id,
      type: TRANSACTION_TYPES.TRANSFER,
      amountMinor: validatedData.amountMinor,
      fromAccountId: validatedData.fromAccountId,
      toAccountId: validatedData.toAccountId,
      transactionDate: validatedData.transactionDate,
      description: validatedData.description,
      notes: validatedData.notes,
      paymentMethod: 'net_banking',
    });

    // Atomically update both accounts: source decreases, destination increases
    await Promise.all([
      Account.updateOne(
        { _id: fromAccount._id },
        { $inc: { currentBalanceMinor: -validatedData.amountMinor } }
      ),
      Account.updateOne(
        { _id: toAccount._id },
        { $inc: { currentBalanceMinor: validatedData.amountMinor } }
      ),
    ]);

    const populated = await Transaction.findById(transaction._id)
      .populate('fromAccountId', 'name accountType color')
      .populate('toAccountId', 'name accountType color');

    res.status(201).json({
      success: true,
      transaction: populated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Update transaction & recalculate balance impact
 * @route   PATCH /api/v1/transactions/:id
 * @access  Private
 */
export async function updateTransaction(req, res, next) {
  try {
    const validatedData = updateTransactionSchema.parse(req.body);

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access unauthorized',
      });
    }

    // Handle amount change balance recalculation
    if (
      validatedData.amountMinor !== undefined &&
      validatedData.amountMinor !== transaction.amountMinor
    ) {
      const oldAmount = transaction.amountMinor;
      const newAmount = validatedData.amountMinor;
      const delta = newAmount - oldAmount;

      if (transaction.type === TRANSACTION_TYPES.INCOME) {
        await Account.updateOne(
          { _id: transaction.accountId },
          { $inc: { currentBalanceMinor: delta } }
        );
      } else if (transaction.type === TRANSACTION_TYPES.EXPENSE) {
        await Account.updateOne(
          { _id: transaction.accountId },
          { $inc: { currentBalanceMinor: -delta } }
        );
      } else if (transaction.type === TRANSACTION_TYPES.TRANSFER) {
        await Promise.all([
          Account.updateOne(
            { _id: transaction.fromAccountId },
            { $inc: { currentBalanceMinor: -delta } }
          ),
          Account.updateOne(
            { _id: transaction.toAccountId },
            { $inc: { currentBalanceMinor: delta } }
          ),
        ]);
      }
      transaction.amountMinor = newAmount;
    }

    if (validatedData.description) transaction.description = validatedData.description;
    if (validatedData.notes !== undefined) transaction.notes = validatedData.notes;
    if (validatedData.categoryId !== undefined) transaction.categoryId = validatedData.categoryId;
    if (validatedData.transactionDate) transaction.transactionDate = validatedData.transactionDate;
    if (validatedData.paymentMethod) transaction.paymentMethod = validatedData.paymentMethod;

    await transaction.save();

    const populated = await Transaction.findById(transaction._id)
      .populate('accountId', 'name accountType color')
      .populate('fromAccountId', 'name accountType color')
      .populate('toAccountId', 'name accountType color')
      .populate('categoryId', 'name type icon color');

    if (transaction.type === TRANSACTION_TYPES.EXPENSE) {
      await evaluateBudgetsForUser(req.user._id, transaction.transactionDate);
    }

    res.status(200).json({
      success: true,
      transaction: populated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Delete transaction & revert account balance
 * @route   DELETE /api/v1/transactions/:id
 * @access  Private
 */
export async function deleteTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found or access unauthorized',
      });
    }

    // Revert account balance impact
    if (transaction.type === TRANSACTION_TYPES.INCOME) {
      await Account.updateOne(
        { _id: transaction.accountId },
        { $inc: { currentBalanceMinor: -transaction.amountMinor } }
      );
    } else if (transaction.type === TRANSACTION_TYPES.EXPENSE) {
      await Account.updateOne(
        { _id: transaction.accountId },
        { $inc: { currentBalanceMinor: transaction.amountMinor } }
      );
    } else if (transaction.type === TRANSACTION_TYPES.TRANSFER) {
      await Promise.all([
        Account.updateOne(
          { _id: transaction.fromAccountId },
          { $inc: { currentBalanceMinor: transaction.amountMinor } }
        ),
        Account.updateOne(
          { _id: transaction.toAccountId },
          { $inc: { currentBalanceMinor: -transaction.amountMinor } }
        ),
      ]);
    }

    await Transaction.deleteOne({ _id: transaction._id });

    if (transaction.type === TRANSACTION_TYPES.EXPENSE) {
      await evaluateBudgetsForUser(req.user._id, transaction.transactionDate);
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted and account balance restored successfully',
    });
  } catch (error) {
    next(error);
  }
}
