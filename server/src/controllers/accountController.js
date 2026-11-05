import { Account } from '../models/Account.js';
import { createAccountSchema, updateAccountSchema } from '../validators/accountValidator.js';

/**
 * @desc    Get all accounts for authenticated user
 * @route   GET /api/v1/accounts
 * @access  Private
 */
export async function getAccounts(req, res, next) {
  try {
    const includeArchived = req.query.includeArchived === 'true';
    const filter = { userId: req.user._id };

    if (!includeArchived) {
      filter.isArchived = false;
    }

    const accounts = await Account.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: accounts.length,
      accounts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get single account details
 * @route   GET /api/v1/accounts/:id
 * @access  Private
 */
export async function getAccountById(req, res, next) {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or access unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create new financial account
 * @route   POST /api/v1/accounts
 * @access  Private
 */
export async function createAccount(req, res, next) {
  try {
    const validatedData = createAccountSchema.parse(req.body);

    // Check duplicate account name for this user
    const existing = await Account.findOne({
      userId: req.user._id,
      name: validatedData.name,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `An account named "${validatedData.name}" already exists`,
      });
    }

    const account = await Account.create({
      userId: req.user._id,
      name: validatedData.name,
      accountType: validatedData.accountType,
      openingBalanceMinor: validatedData.openingBalanceMinor,
      currentBalanceMinor: validatedData.openingBalanceMinor,
      color: validatedData.color,
      icon: validatedData.icon,
      notes: validatedData.notes,
    });

    res.status(201).json({
      success: true,
      account,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Update account metadata
 * @route   PATCH /api/v1/accounts/:id
 * @access  Private
 */
export async function updateAccount(req, res, next) {
  try {
    const validatedData = updateAccountSchema.parse(req.body);

    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or access unauthorized',
      });
    }

    // If name is changing, check uniqueness
    if (validatedData.name && validatedData.name !== account.name) {
      const duplicate = await Account.findOne({
        userId: req.user._id,
        name: validatedData.name,
        _id: { $ne: account._id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: `An account named "${validatedData.name}" already exists`,
        });
      }
      account.name = validatedData.name;
    }

    if (validatedData.accountType) account.accountType = validatedData.accountType;
    if (validatedData.color) account.color = validatedData.color;
    if (validatedData.icon) account.icon = validatedData.icon;
    if (validatedData.isArchived !== undefined) account.isArchived = validatedData.isArchived;
    if (validatedData.notes !== undefined) account.notes = validatedData.notes;

    await account.save();

    res.status(200).json({
      success: true,
      account,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Archive account (soft-delete to preserve ledger history)
 * @route   DELETE /api/v1/accounts/:id
 * @access  Private
 */
export async function archiveAccount(req, res, next) {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or access unauthorized',
      });
    }

    account.isArchived = true;
    await account.save();

    res.status(200).json({
      success: true,
      message: `Account "${account.name}" archived successfully`,
    });
  } catch (error) {
    next(error);
  }
}
