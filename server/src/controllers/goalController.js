import { SavingsGoal } from '../models/SavingsGoal.js';
import { GoalContribution } from '../models/GoalContribution.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { sanitizeText } from '../utils/sanitize.js';
import { formatINR } from '../utils/money.js';
import {
  createGoalSchema,
  updateGoalSchema,
  createContributionSchema,
} from '../validators/goalValidator.js';

/**
 * GET /api/v1/goals
 * List all savings goals for authenticated user
 */
export async function getGoals(req, res, next) {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const goals = await SavingsGoal.find(filter).sort({ targetDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: goals,
      count: goals.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/goals/:id
 * Retrieve a single savings goal with contribution history
 */
export async function getGoalById(req, res, next) {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or access unauthorized' },
      });
    }

    const contributions = await GoalContribution.find({
      goalId: goal._id,
      userId: req.user._id,
    })
      .sort({ contributionDate: -1 })
      .populate('accountId', 'name type currentBalanceMinor');

    res.status(200).json({
      success: true,
      data: {
        goal,
        contributions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/goals
 * Create a new savings goal
 */
export async function createGoal(req, res, next) {
  try {
    const validated = createGoalSchema.parse(req.body);

    const goal = await SavingsGoal.create({
      userId: req.user._id,
      name: sanitizeText(validated.name),
      targetAmountMinor: validated.targetAmountMinor,
      targetDate: new Date(validated.targetDate),
      category: validated.category,
      color: validated.color,
      icon: validated.icon,
      notes: validated.notes ? sanitizeText(validated.notes) : '',
    });

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/goals/:id
 * Update savings goal details
 */
export async function updateGoal(req, res, next) {
  try {
    const validated = updateGoalSchema.parse(req.body);

    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or access unauthorized' },
      });
    }

    if (validated.name !== undefined) goal.name = sanitizeText(validated.name);
    if (validated.targetAmountMinor !== undefined) {
      goal.targetAmountMinor = validated.targetAmountMinor;
      // Re-evaluate reached status
      if (goal.currentAmountMinor >= validated.targetAmountMinor) {
        goal.isReached = true;
        if (!goal.reachedAt) goal.reachedAt = new Date();
      } else {
        goal.isReached = false;
        goal.reachedAt = null;
      }
    }
    if (validated.targetDate !== undefined) goal.targetDate = new Date(validated.targetDate);
    if (validated.category !== undefined) goal.category = validated.category;
    if (validated.color !== undefined) goal.color = validated.color;
    if (validated.icon !== undefined) goal.icon = validated.icon;
    if (validated.status !== undefined) goal.status = validated.status;
    if (validated.notes !== undefined) goal.notes = sanitizeText(validated.notes);

    await goal.save();

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/goals/:id
 * Delete a savings goal and its associated contributions
 */
export async function deleteGoal(req, res, next) {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or access unauthorized' },
      });
    }

    // Remove contributions
    await GoalContribution.deleteMany({ goalId: goal._id, userId: req.user._id });
    await goal.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Savings goal and contributions deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/goals/:id/contributions
 * Record a contribution towards a savings goal
 */
export async function addContribution(req, res, next) {
  try {
    const validated = createContributionSchema.parse(req.body);

    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or access unauthorized' },
      });
    }

    const { amountMinor, accountId, contributionDate, notes } = validated;
    let transaction = null;

    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId: req.user._id });
      if (!account) {
        return res.status(404).json({
          success: false,
          error: { code: 'ACCOUNT_NOT_FOUND', message: 'Selected account not found or access unauthorized' },
        });
      }

      // Find or assign category
      let category = await Category.findOne({ userId: req.user._id, name: 'Savings & Investments' });
      if (!category) {
        category = await Category.findOne({ type: 'expense' });
      }

      // Record ledger transaction to keep derived balance aligned (DEC-002, DEC-010)
      transaction = await Transaction.create({
        userId: req.user._id,
        accountId: account._id,
        type: 'expense',
        amountMinor,
        description: `Savings Goal: ${goal.name}`,
        categoryId: category?._id,
        transactionDate: contributionDate ? new Date(contributionDate) : new Date(),
        notes: notes ? sanitizeText(notes) : '',
      });

      // Atomically decrement account balance
      await Account.findByIdAndUpdate(account._id, {
        $inc: { currentBalanceMinor: -amountMinor },
      });
    }

    // Create contribution
    const contribution = await GoalContribution.create({
      userId: req.user._id,
      goalId: goal._id,
      accountId: accountId || null,
      amountMinor,
      contributionDate: contributionDate ? new Date(contributionDate) : new Date(),
      notes: notes ? sanitizeText(notes) : '',
      transactionId: transaction ? transaction._id : null,
    });

    // Increment goal current amount
    goal.currentAmountMinor += amountMinor;

    // Milestone evaluation
    const progressPct = Math.round((goal.currentAmountMinor / goal.targetAmountMinor) * 100);
    const milestones = ['25', '50', '75', '100'];

    for (const milestone of milestones) {
      const threshold = parseInt(milestone, 10);
      if (progressPct >= threshold && !goal.milestonesFired.includes(milestone)) {
        goal.milestonesFired.push(milestone);

        if (milestone === '100') {
          goal.isReached = true;
          goal.reachedAt = new Date();
          goal.status = 'completed';

          await Notification.create({
            userId: req.user._id,
            title: `🎉 Savings Goal Achieved: ${goal.name}!`,
            message: `Congratulations! You reached 100% of your target for "${goal.name}" (${formatINR(goal.targetAmountMinor)}).`,
            type: 'goal_milestone',
            relatedId: goal._id,
          });

          await AuditLog.create({
            userId: req.user._id,
            action: 'GOAL_ACHIEVED',
            entityType: 'SavingsGoal',
            entityId: goal._id.toString(),
            metadata: { goalName: goal.name, targetAmountMinor: goal.targetAmountMinor },
          });
        } else {
          await Notification.create({
            userId: req.user._id,
            title: `Savings Goal Milestone: ${goal.name}`,
            message: `You've reached ${milestone}% of your target for "${goal.name}". Progress: ${formatINR(goal.currentAmountMinor)} / ${formatINR(goal.targetAmountMinor)}.`,
            type: 'goal_milestone',
            relatedId: goal._id,
          });
        }
      }
    }

    await goal.save();

    res.status(201).json({
      success: true,
      data: {
        contribution,
        goal,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/goals/:id/contributions
 * List all contributions for a savings goal
 */
export async function getContributions(req, res, next) {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or access unauthorized' },
      });
    }

    const contributions = await GoalContribution.find({
      goalId: goal._id,
      userId: req.user._id,
    })
      .sort({ contributionDate: -1 })
      .populate('accountId', 'name type');

    res.status(200).json({
      success: true,
      data: contributions,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/goals/:id/contributions/:contributionId
 * Reverse and delete a contribution
 */
export async function deleteContribution(req, res, next) {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or access unauthorized' },
      });
    }

    const contribution = await GoalContribution.findOne({
      _id: req.params.contributionId,
      goalId: goal._id,
      userId: req.user._id,
    });

    if (!contribution) {
      return res.status(404).json({
        success: false,
        error: { code: 'CONTRIBUTION_NOT_FOUND', message: 'Contribution not found or unauthorized' },
      });
    }

    // If there is an associated transaction and account, reverse the account balance
    if (contribution.transactionId && contribution.accountId) {
      await Transaction.findByIdAndDelete(contribution.transactionId);
      await Account.findByIdAndUpdate(contribution.accountId, {
        $inc: { currentBalanceMinor: contribution.amountMinor },
      });
    }

    // Decrement goal current amount
    goal.currentAmountMinor = Math.max(0, goal.currentAmountMinor - contribution.amountMinor);

    // If goal was reached but dropped below, reset reached status
    if (goal.currentAmountMinor < goal.targetAmountMinor) {
      goal.isReached = false;
      goal.reachedAt = null;
      if (goal.status === 'completed') {
        goal.status = 'active';
      }
    }

    await goal.save();
    await contribution.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Contribution reversed and removed successfully',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
}
