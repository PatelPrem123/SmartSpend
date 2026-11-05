import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { createBudgetSchema, updateBudgetSchema } from '../validators/budgetValidator.js';
import { evaluateBudgetsForUser } from '../services/budget/budgetEvaluator.js';

/**
 * Create a new Category or Overall Budget
 * POST /api/v1/budgets
 */
export async function createBudget(req, res, next) {
  try {
    const validatedData = createBudgetSchema.parse(req.body);

    // If categoryId provided, verify ownership (BOLA Defense)
    if (validatedData.categoryId) {
      const category = await Category.findOne({
        _id: validatedData.categoryId,
        userId: req.user._id,
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Category not found or does not belong to you',
        });
      }
    }

    // Check duplicate budget
    const existing = await Budget.findOne({
      userId: req.user._id,
      monthYear: validatedData.monthYear,
      categoryId: validatedData.categoryId || null,
      isOverall: validatedData.isOverall || false,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A budget for ${validatedData.isOverall ? 'overall monthly' : 'this category'} in ${validatedData.monthYear} already exists`,
      });
    }

    const budget = await Budget.create({
      userId: req.user._id,
      categoryId: validatedData.categoryId || null,
      isOverall: validatedData.isOverall || false,
      monthYear: validatedData.monthYear,
      amountLimitMinor: validatedData.amountLimitMinor,
      notes: validatedData.notes || '',
    });

    // Run evaluation to get live spent & utilization
    const evaluated = await evaluateBudgetsForUser(req.user._id, `${budget.monthYear}-01`);
    const budgetEvaluated = evaluated.find((b) => b._id.toString() === budget._id.toString());

    res.status(201).json({
      success: true,
      budget: budgetEvaluated || budget,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all evaluated budgets for a specific month
 * GET /api/v1/budgets
 */
export async function getBudgets(req, res, next) {
  try {
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthYear = req.query.monthYear || currentMonthYear;

    const evaluated = await evaluateBudgetsForUser(req.user._id, `${monthYear}-01`);

    res.status(200).json({
      success: true,
      monthYear,
      budgets: evaluated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single budget by ID
 * GET /api/v1/budgets/:id
 */
export async function getBudgetById(req, res, next) {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate('categoryId', 'name icon color');

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found or access unauthorized',
      });
    }

    const evaluated = await evaluateBudgetsForUser(req.user._id, `${budget.monthYear}-01`);
    const match = evaluated.find((b) => b._id.toString() === budget._id.toString());

    res.status(200).json({
      success: true,
      budget: match || budget,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update budget limit or notes
 * PATCH /api/v1/budgets/:id
 */
export async function updateBudget(req, res, next) {
  try {
    const validatedData = updateBudgetSchema.parse(req.body);

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found or access unauthorized',
      });
    }

    if (validatedData.amountLimitMinor !== undefined) {
      budget.amountLimitMinor = validatedData.amountLimitMinor;
    }
    if (validatedData.notes !== undefined) {
      budget.notes = validatedData.notes;
    }

    await budget.save();

    const evaluated = await evaluateBudgetsForUser(req.user._id, `${budget.monthYear}-01`);
    const match = evaluated.find((b) => b._id.toString() === budget._id.toString());

    res.status(200).json({
      success: true,
      budget: match || budget,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete budget
 * DELETE /api/v1/budgets/:id
 */
export async function deleteBudget(req, res, next) {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found or access unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget removed successfully',
    });
  } catch (error) {
    next(error);
  }
}
