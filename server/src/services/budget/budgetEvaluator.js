import mongoose from 'mongoose';
import { Budget } from '../../models/Budget.js';
import { Transaction } from '../../models/Transaction.js';
import { Notification } from '../../models/Notification.js';
import { TRANSACTION_TYPES } from '../../config/constants.js';

const { ObjectId } = mongoose.Types;

/**
 * Evaluates monthly budgets for a user and triggers idempotent threshold alerts (DEC-004)
 * @param {string|ObjectId} userId
 * @param {Date|string} [targetDate=new Date()]
 * @returns {Promise<Array<Object>>}
 */
export async function evaluateBudgetsForUser(userId, targetDate = new Date()) {
  const userObjectId = new ObjectId(userId);
  const dateObj = new Date(targetDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const monthYear = `${year}-${String(month + 1).padStart(2, '0')}`;
  const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // 1. Fetch all budgets configured for this monthYear
  const budgets = await Budget.find({
    userId: userObjectId,
    monthYear,
  }).populate('categoryId', 'name icon color');

  if (!budgets || budgets.length === 0) {
    return [];
  }

  // 2. Fetch all expenses for this user within this month
  const expenseAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        type: TRANSACTION_TYPES.EXPENSE,
        transactionDate: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      },
    },
    {
      $group: {
        _id: '$categoryId',
        totalSpentMinor: { $sum: '$amountMinor' },
      },
    },
  ]);

  const totalMonthlySpentMinor = expenseAgg.reduce((sum, item) => sum + item.totalSpentMinor, 0);
  const categorySpentMap = new Map();
  expenseAgg.forEach((item) => {
    if (item._id) {
      categorySpentMap.set(item._id.toString(), item.totalSpentMinor);
    }
  });

  const evaluationResults = [];

  // 3. Process each budget
  for (const budget of budgets) {
    let spentMinor = 0;
    let label = 'Overall Monthly';

    if (budget.isOverall) {
      spentMinor = totalMonthlySpentMinor;
      label = 'Overall Monthly';
    } else if (budget.categoryId) {
      const catIdStr = budget.categoryId._id
        ? budget.categoryId._id.toString()
        : budget.categoryId.toString();
      spentMinor = categorySpentMap.get(catIdStr) || 0;
      label = budget.categoryId.name ? `${budget.categoryId.name}` : 'Category';
    }

    const limitMinor = budget.amountLimitMinor;
    const remainingMinor = Math.max(0, limitMinor - spentMinor);
    const utilization = limitMinor > 0 ? Math.round((spentMinor / limitMinor) * 1000) / 10 : 0;

    let statusTier = 'safe';
    if (utilization >= 100) {
      statusTier = 'exceeded';
    } else if (utilization >= 90) {
      statusTier = 'critical';
    } else if (utilization >= 75) {
      statusTier = 'warning';
    }

    // Check idempotent threshold notifications: 50, 75, 90, 100 (Atomic DEC-004)
    const thresholds = ['50', '75', '90', '100'];

    for (const tier of thresholds) {
      const tierNum = parseInt(tier, 10);
      if (utilization >= tierNum && !budget.alertThresholdsFired.includes(tier)) {
        // Atomic compare-and-swap update to guarantee idempotency across concurrent callers
        const updated = await Budget.findOneAndUpdate(
          { _id: budget._id, alertThresholdsFired: { $ne: tier } },
          { $push: { alertThresholdsFired: tier } },
          { new: true }
        );

        if (updated) {
          budget.alertThresholdsFired.push(tier);

          let title = '';
          let message = '';
          let severity = 'info';

          const spentRupees = (spentMinor / 100).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
          });
          const limitRupees = (limitMinor / 100).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
          });

          if (tier === '50') {
            title = `Budget 50% Milestone Reached`;
            message = `You have spent 50% (₹${spentRupees} of ₹${limitRupees}) of your ${label} budget for ${monthYear}.`;
            severity = 'info';
          } else if (tier === '75') {
            title = `Budget Warning (75%)`;
            message = `You have spent 75% (₹${spentRupees} of ₹${limitRupees}) of your ${label} budget for ${monthYear}.`;
            severity = 'warning';
          } else if (tier === '90') {
            title = `Critical Budget Alert (90%)`;
            message = `Attention: 90% (₹${spentRupees} of ₹${limitRupees}) of your ${label} budget has been utilized for ${monthYear}.`;
            severity = 'warning';
          } else if (tier === '100') {
            title = `Budget Exceeded (100%+)`;
            message = `Limit Exceeded: You have spent ₹${spentRupees}, exceeding your ₹${limitRupees} ${label} budget for ${monthYear}!`;
            severity = 'critical';
          }

          // Create persistent Notification
          await Notification.create({
            userId: userObjectId,
            title,
            message,
            type: 'budget_alert',
            severity,
            relatedId: budget._id,
          });
        }
      }
    }

    evaluationResults.push({
      _id: budget._id,
      monthYear: budget.monthYear,
      isOverall: budget.isOverall,
      category: budget.categoryId || null,
      amountLimitMinor: limitMinor,
      spentMinor,
      remainingMinor,
      utilization,
      statusTier,
      alertThresholdsFired: budget.alertThresholdsFired,
      notes: budget.notes,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    });
  }

  return evaluationResults;
}
