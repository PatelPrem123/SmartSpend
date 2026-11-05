import mongoose from 'mongoose';
import { Transaction } from '../../models/Transaction.js';
import { Account } from '../../models/Account.js';
import { Category } from '../../models/Category.js';
import { TRANSACTION_TYPES } from '../../config/constants.js';
import { calculateNetCashFlow, calculateSavingsRate } from '../../utils/money.js';

const { ObjectId } = mongoose.Types;

/**
 * Derives the exact mathematical balance of an account from raw ledger events:
 * Balance(A) = OpeningBalance(A) + Sum(Income) - Sum(Expense) + Sum(TransfersIn) - Sum(TransfersOut)
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} accountId
 * @returns {Promise<number>} Derived balance in integer paise
 */
export async function getAccountDerivedBalance(userId, accountId) {
  const userObjectId = new ObjectId(userId);
  const accountObjectId = new ObjectId(accountId);

  const account = await Account.findOne({ _id: accountObjectId, userId: userObjectId });
  if (!account) {
    throw new Error('Account not found or access unauthorized');
  }

  // 1. Sum Income for this account
  const incomeAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        accountId: accountObjectId,
        type: TRANSACTION_TYPES.INCOME,
      },
    },
    { $group: { _id: null, total: { $sum: '$amountMinor' } } },
  ]);
  const totalIncome = incomeAgg[0]?.total || 0;

  // 2. Sum Expenses for this account
  const expenseAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        accountId: accountObjectId,
        type: TRANSACTION_TYPES.EXPENSE,
      },
    },
    { $group: { _id: null, total: { $sum: '$amountMinor' } } },
  ]);
  const totalExpense = expenseAgg[0]?.total || 0;

  // 3. Sum Transfers In (Credited)
  const transferInAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        toAccountId: accountObjectId,
        type: TRANSACTION_TYPES.TRANSFER,
      },
    },
    { $group: { _id: null, total: { $sum: '$amountMinor' } } },
  ]);
  const totalTransferIn = transferInAgg[0]?.total || 0;

  // 4. Sum Transfers Out (Debited)
  const transferOutAgg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        fromAccountId: accountObjectId,
        type: TRANSACTION_TYPES.TRANSFER,
      },
    },
    { $group: { _id: null, total: { $sum: '$amountMinor' } } },
  ]);
  const totalTransferOut = transferOutAgg[0]?.total || 0;

  const derivedBalance =
    account.openingBalanceMinor + totalIncome - totalExpense + totalTransferIn - totalTransferOut;

  return derivedBalance;
}

/**
 * Computes high-level financial summary metrics for a given time window:
 * - Total Income (transfers excluded)
 * - Total Expense (transfers excluded)
 * - Net Cash Flow
 * - Savings Rate % with zero-income guard
 * - Total Accounts Balance
 * @param {string|ObjectId} userId
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 * @returns {Promise<Object>}
 */
export async function getDashboardSummaryMetrics(userId, startDate, endDate) {
  const userObjectId = new ObjectId(userId);

  const matchFilter = {
    userId: userObjectId,
  };

  if (startDate || endDate) {
    matchFilter.transactionDate = {};
    if (startDate) matchFilter.transactionDate.$gte = new Date(startDate);
    if (endDate) matchFilter.transactionDate.$lte = new Date(endDate);
  }

  // Aggregate income and expense (transfers strictly excluded DEC-003)
  const totalsAgg = await Transaction.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$type',
        totalMinor: { $sum: '$amountMinor' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;
  let transactionCount = 0;

  totalsAgg.forEach((item) => {
    transactionCount += item.count;
    if (item._id === TRANSACTION_TYPES.INCOME) {
      totalIncomeMinor = item.totalMinor;
    } else if (item._id === TRANSACTION_TYPES.EXPENSE) {
      totalExpenseMinor = item.totalMinor;
    }
  });

  const netCashFlowMinor = calculateNetCashFlow(totalIncomeMinor, totalExpenseMinor);
  const savingsRate = calculateSavingsRate(totalIncomeMinor, totalExpenseMinor);

  // Sum total balances across active accounts
  const accountsAgg = await Account.aggregate([
    { $match: { userId: userObjectId, isArchived: false } },
    { $group: { _id: null, totalBalance: { $sum: '$currentBalanceMinor' } } },
  ]);

  const totalAccountsBalanceMinor = accountsAgg[0]?.totalBalance || 0;

  return {
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
    totalIncomeMinor,
    totalExpenseMinor,
    netCashFlowMinor,
    savingsRate,
    totalAccountsBalanceMinor,
    transactionCount,
  };
}

/**
 * Computes distribution of spending or income grouped by category for donut/pie charts
 * @param {string|ObjectId} userId
 * @param {Date} [startDate]
 * @param {Date} [endDate]
 * @param {'expense'|'income'} [type='expense']
 * @returns {Promise<Array>}
 */
export async function getCategoryDistribution(
  userId,
  startDate,
  endDate,
  type = TRANSACTION_TYPES.EXPENSE
) {
  const userObjectId = new ObjectId(userId);

  const matchFilter = {
    userId: userObjectId,
    type,
  };

  if (startDate || endDate) {
    matchFilter.transactionDate = {};
    if (startDate) matchFilter.transactionDate.$gte = new Date(startDate);
    if (endDate) matchFilter.transactionDate.$lte = new Date(endDate);
  }

  const distribution = await Transaction.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$categoryId',
        totalMinor: { $sum: '$amountMinor' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalMinor: -1 } },
  ]);

  const grandTotalMinor = distribution.reduce((acc, curr) => acc + curr.totalMinor, 0);

  // Populate category metadata
  const populated = await Promise.all(
    distribution.map(async (item) => {
      let name = 'Uncategorized';
      let color = '#64748b';
      let icon = 'Tag';

      if (item._id) {
        const cat = await Category.findById(item._id);
        if (cat) {
          name = cat.name;
          color = cat.color || '#64748b';
          icon = cat.icon || 'Tag';
        }
      }

      const percentage =
        grandTotalMinor > 0 ? Math.round((item.totalMinor / grandTotalMinor) * 1000) / 10 : 0;

      return {
        categoryId: item._id,
        categoryName: name,
        categoryColor: color,
        categoryIcon: icon,
        totalMinor: item.totalMinor,
        percentage,
        count: item.count,
      };
    })
  );

  return {
    grandTotalMinor,
    type,
    items: populated,
  };
}

/**
 * Computes monthly time series for Recharts line/bar chart visualization
 * @param {string|ObjectId} userId
 * @param {number} [monthsCount=6]
 * @returns {Promise<Array>}
 */
export async function getMonthlyCashFlowTimeSeries(userId, monthsCount = 6) {
  const userObjectId = new ObjectId(userId);

  // Calculate start date going back monthsCount
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsCount + 1, 1);

  const agg = await Transaction.aggregate([
    {
      $match: {
        userId: userObjectId,
        transactionDate: { $gte: startDate },
        type: { $in: [TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE] },
      },
    },
    {
      $project: {
        amountMinor: 1,
        type: 1,
        yearMonth: { $dateToString: { format: '%Y-%m', date: '$transactionDate' } },
      },
    },
    {
      $group: {
        _id: {
          yearMonth: '$yearMonth',
          type: '$type',
        },
        totalMinor: { $sum: '$amountMinor' },
      },
    },
  ]);

  // Generate complete list of months to guarantee no missing month gaps
  const result = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

    const incomeItem = agg.find(
      (a) => a._id.yearMonth === yearMonth && a._id.type === TRANSACTION_TYPES.INCOME
    );
    const expenseItem = agg.find(
      (a) => a._id.yearMonth === yearMonth && a._id.type === TRANSACTION_TYPES.EXPENSE
    );

    const incomeMinor = incomeItem?.totalMinor || 0;
    const expenseMinor = expenseItem?.totalMinor || 0;
    const netCashFlowMinor = incomeMinor - expenseMinor;

    result.push({
      yearMonth,
      monthLabel,
      incomeMinor,
      expenseMinor,
      netCashFlowMinor,
    });
  }

  return result;
}
