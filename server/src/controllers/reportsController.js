import {
  getMonthlyCashFlowTimeSeries,
  getCategoryDistribution,
  getAccountDerivedBalance,
} from '../services/finance/calculationEngine.js';
import { buildExcelWorkbook, streamPdfReport } from '../services/reports/exportService.js';
import { Transaction } from '../models/Transaction.js';
import { TRANSACTION_TYPES } from '../config/constants.js';
import { calculateNetCashFlow, calculateSavingsRate } from '../utils/money.js';

/**
 * Controller for retrieving monthly cash flow time series
 * GET /api/v1/reports/cashflow
 */
export async function getCashFlowReport(req, res, next) {
  try {
    const months = req.query.months ? parseInt(req.query.months, 10) : 6;
    const cashFlowSeries = await getMonthlyCashFlowTimeSeries(req.user._id, months);

    res.status(200).json({
      success: true,
      cashFlowSeries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for retrieving category spending/income distribution
 * GET /api/v1/reports/categories
 */
export async function getCategoryDistributionReport(req, res, next) {
  try {
    const { startDate, endDate, type } = req.query;
    const distribution = await getCategoryDistribution(
      req.user._id,
      startDate,
      endDate,
      type || 'expense'
    );

    res.status(200).json({
      success: true,
      distribution,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for verifying derived mathematical ledger balance of an account
 * GET /api/v1/reports/accounts/:accountId/derived-balance
 */
export async function getAccountDerivedBalanceReport(req, res, next) {
  try {
    const { accountId } = req.params;
    const derivedBalanceMinor = await getAccountDerivedBalance(req.user._id, accountId);

    res.status(200).json({
      success: true,
      accountId,
      derivedBalanceMinor,
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('unauthorized')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

/**
 * Streams formatted multi-sheet Excel workbook export (DEC-011)
 * GET /api/v1/reports/export/excel
 */
export async function exportExcelReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const workbook = await buildExcelWorkbook(req.user._id, { startDate, endDate });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="smartspend-report-${Date.now()}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
}

/**
 * Streams printable PDF statement export (DEC-011)
 * GET /api/v1/reports/export/pdf
 */
export async function exportPdfReport(req, res, next) {
  try {
    const { startDate, endDate, monthYear } = req.query;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="smartspend-statement-${Date.now()}.pdf"`
    );

    await streamPdfReport(req.user._id, res, { startDate, endDate, monthYear });
  } catch (error) {
    next(error);
  }
}

/**
 * Annual Financial Performance Summary across 12 calendar months (DEC-002, DEC-010)
 * GET /api/v1/reports/annual-summary
 */
export async function getAnnualFinancialSummary(req, res, next) {
  try {
    const targetYear = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const months = [];

    let totalAnnualIncomeMinor = 0;
    let totalAnnualExpenseMinor = 0;

    for (let m = 0; m < 12; m++) {
      const start = new Date(targetYear, m, 1);
      const end = new Date(targetYear, m + 1, 0, 23, 59, 59, 999);
      const monthStr = `${targetYear}-${String(m + 1).padStart(2, '0')}`;

      // Aggregate income
      const incomeAgg = await Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            type: TRANSACTION_TYPES.INCOME,
            transactionDate: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountMinor' } } },
      ]);
      const incomeMinor = incomeAgg[0]?.total || 0;

      // Aggregate expense
      const expenseAgg = await Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            type: TRANSACTION_TYPES.EXPENSE,
            transactionDate: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountMinor' } } },
      ]);
      const expenseMinor = expenseAgg[0]?.total || 0;

      const netMinor = calculateNetCashFlow(incomeMinor, expenseMinor);
      const savingsRate = calculateSavingsRate(incomeMinor, expenseMinor);

      totalAnnualIncomeMinor += incomeMinor;
      totalAnnualExpenseMinor += expenseMinor;

      months.push({
        month: monthStr,
        monthName: start.toLocaleString('en-IN', { month: 'short' }),
        incomeMinor,
        expenseMinor,
        netCashFlowMinor: netMinor,
        savingsRate,
      });
    }

    const annualNetCashFlowMinor = calculateNetCashFlow(
      totalAnnualIncomeMinor,
      totalAnnualExpenseMinor
    );
    const annualSavingsRate = calculateSavingsRate(
      totalAnnualIncomeMinor,
      totalAnnualExpenseMinor
    );

    res.status(200).json({
      success: true,
      year: targetYear,
      months,
      annualTotals: {
        totalIncomeMinor: totalAnnualIncomeMinor,
        totalExpenseMinor: totalAnnualExpenseMinor,
        netCashFlowMinor: annualNetCashFlowMinor,
        savingsRate: annualSavingsRate,
      },
    });
  } catch (error) {
    next(error);
  }
}
