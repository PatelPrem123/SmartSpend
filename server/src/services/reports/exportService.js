import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Transaction } from '../../models/Transaction.js';
import { Account } from '../../models/Account.js';
import { Budget } from '../../models/Budget.js';
import { SavingsGoal } from '../../models/SavingsGoal.js';
import { User } from '../../models/User.js';
import { TRANSACTION_TYPES } from '../../config/constants.js';
import { formatINR, paiseToRupees, calculateNetCashFlow, calculateSavingsRate } from '../../utils/money.js';
import { getMonthlyMetrics } from '../finance/calculationEngine.js';

/**
 * Builds an ExcelJS multi-sheet workbook covering overview, accounts, transactions, budgets, and savings goals (DEC-011)
 * @param {string} userId
 * @param {object} options - { startDate, endDate }
 * @returns {Promise<ExcelJS.Workbook>}
 */
export async function buildExcelWorkbook(userId, { startDate, endDate } = {}) {
  const user = await User.findById(userId);
  const filter = { userId };

  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) filter.transactionDate.$lte = new Date(endDate);
  }

  const [accounts, transactions, budgets, goals] = await Promise.all([
    Account.find({ userId }).sort({ createdAt: 1 }),
    Transaction.find(filter)
      .populate('categoryId', 'name')
      .populate('accountId', 'name')
      .populate('fromAccountId', 'name')
      .populate('toAccountId', 'name')
      .sort({ transactionDate: -1 }),
    Budget.find({ userId }).populate('categoryId', 'name').sort({ monthYear: -1 }),
    SavingsGoal.find({ userId }).sort({ targetDate: 1 }),
  ]);

  // Aggregate overview metrics
  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;

  transactions.forEach((tx) => {
    if (tx.type === TRANSACTION_TYPES.INCOME) totalIncomeMinor += tx.amountMinor;
    if (tx.type === TRANSACTION_TYPES.EXPENSE) totalExpenseMinor += tx.amountMinor;
  });

  const netCashFlowMinor = calculateNetCashFlow(totalIncomeMinor, totalExpenseMinor);
  const savingsRate = calculateSavingsRate(totalIncomeMinor, totalExpenseMinor);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SmartSpend FinTech Engine';
  workbook.created = new Date();

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF047857' }, // Emerald-700
  };
  const headerFont = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  // ==========================================
  // SHEET 1: Financial Overview
  // ==========================================
  const overviewSheet = workbook.addWorksheet('Overview & Net Cash Flow');
  overviewSheet.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Value (₹ / %)', key: 'value', width: 26 },
  ];

  overviewSheet.getRow(1).fill = headerFill;
  overviewSheet.getRow(1).font = headerFont;

  overviewSheet.addRows([
    { metric: 'Account Holder', value: user?.name || 'SmartSpend User' },
    { metric: 'Email', value: user?.email || '' },
    { metric: 'Report Generated Date', value: new Date().toLocaleDateString('en-IN') },
    { metric: 'Period Filter', value: startDate && endDate ? `${startDate} to ${endDate}` : 'All Time Ledger' },
    { metric: '----------------------------------------', value: '----------------------------------------' },
    { metric: 'Total Income (Paise Precision)', value: formatINR(totalIncomeMinor) },
    { metric: 'Total Expenses (Paise Precision)', value: formatINR(totalExpenseMinor) },
    { metric: 'Net Cash Flow', value: formatINR(netCashFlowMinor) },
    { metric: 'Savings Rate', value: `${savingsRate}%` },
    { metric: 'Active Accounts Count', value: accounts.length },
    { metric: 'Total Tracked Transactions', value: transactions.length },
  ]);

  // ==========================================
  // SHEET 2: Account Balances
  // ==========================================
  const accountsSheet = workbook.addWorksheet('Account Balances');
  accountsSheet.columns = [
    { header: 'Account Name', key: 'name', width: 28 },
    { header: 'Classification', key: 'accountType', width: 18 },
    { header: 'Opening Balance', key: 'opening', width: 22 },
    { header: 'Current Balance', key: 'current', width: 22 },
    { header: 'Currency', key: 'currency', width: 12 },
    { header: 'Status', key: 'status', width: 14 },
  ];
  accountsSheet.getRow(1).fill = headerFill;
  accountsSheet.getRow(1).font = headerFont;

  accounts.forEach((acc) => {
    accountsSheet.addRow({
      name: acc.name,
      accountType: acc.accountType.toUpperCase(),
      opening: paiseToRupees(acc.openingBalanceMinor),
      current: paiseToRupees(acc.currentBalanceMinor),
      currency: acc.currency,
      status: acc.isArchived ? 'ARCHIVED' : 'ACTIVE',
    });
  });
  accountsSheet.getColumn('opening').numFmt = '₹#,##0.00';
  accountsSheet.getColumn('current').numFmt = '₹#,##0.00';

  // ==========================================
  // SHEET 3: All Transactions
  // ==========================================
  const txSheet = workbook.addWorksheet('All Transactions');
  txSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Description', key: 'description', width: 32 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Account / Transfer Route', key: 'account', width: 28 },
    { header: 'Amount (₹)', key: 'amount', width: 18 },
    { header: 'Notes', key: 'notes', width: 28 },
  ];
  txSheet.getRow(1).fill = headerFill;
  txSheet.getRow(1).font = headerFont;

  transactions.forEach((tx) => {
    let accountName = tx.accountId?.name || '-';
    if (tx.type === TRANSACTION_TYPES.TRANSFER) {
      accountName = `${tx.fromAccountId?.name || 'Acc'} -> ${tx.toAccountId?.name || 'Acc'}`;
    }

    txSheet.addRow({
      date: new Date(tx.transactionDate).toLocaleDateString('en-IN'),
      type: tx.type.toUpperCase(),
      description: tx.description,
      category: tx.categoryId?.name || (tx.type === TRANSACTION_TYPES.TRANSFER ? 'Transfer' : '-'),
      account: accountName,
      amount: paiseToRupees(tx.amountMinor),
      notes: tx.notes || '',
    });
  });
  txSheet.getColumn('amount').numFmt = '₹#,##0.00';

  // ==========================================
  // SHEET 4: Budget Performance
  // ==========================================
  const budgetSheet = workbook.addWorksheet('Budget Performance');
  budgetSheet.columns = [
    { header: 'Category / Scope', key: 'name', width: 26 },
    { header: 'Month', key: 'monthYear', width: 14 },
    { header: 'Budget Limit (₹)', key: 'limit', width: 20 },
    { header: 'Spent (₹)', key: 'spent', width: 20 },
    { header: 'Utilization (%)', key: 'utilization', width: 16 },
    { header: 'Remaining (₹)', key: 'remaining', width: 20 },
  ];
  budgetSheet.getRow(1).fill = headerFill;
  budgetSheet.getRow(1).font = headerFont;

  budgets.forEach((b) => {
    budgetSheet.addRow({
      name: b.isOverall ? 'OVERALL MONTHLY' : b.categoryId?.name || 'Category',
      monthYear: b.monthYear,
      limit: paiseToRupees(b.amountLimitMinor),
      spent: paiseToRupees(b.currentSpentMinor),
      utilization: `${b.utilizationPercentage}%`,
      remaining: paiseToRupees(Math.max(0, b.amountLimitMinor - b.currentSpentMinor)),
    });
  });
  budgetSheet.getColumn('limit').numFmt = '₹#,##0.00';
  budgetSheet.getColumn('spent').numFmt = '₹#,##0.00';
  budgetSheet.getColumn('remaining').numFmt = '₹#,##0.00';

  // ==========================================
  // SHEET 5: Savings Goals
  // ==========================================
  const goalsSheet = workbook.addWorksheet('Savings Goals');
  goalsSheet.columns = [
    { header: 'Goal Name', key: 'name', width: 28 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Target (₹)', key: 'target', width: 20 },
    { header: 'Current Saved (₹)', key: 'saved', width: 20 },
    { header: 'Progress (%)', key: 'progress', width: 16 },
    { header: 'Target Date', key: 'targetDate', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
  ];
  goalsSheet.getRow(1).fill = headerFill;
  goalsSheet.getRow(1).font = headerFont;

  goals.forEach((g) => {
    const pct = Math.min(100, Math.round((g.currentAmountMinor / g.targetAmountMinor) * 100));
    goalsSheet.addRow({
      name: g.name,
      category: g.category,
      target: paiseToRupees(g.targetAmountMinor),
      saved: paiseToRupees(g.currentAmountMinor),
      progress: `${pct}%`,
      targetDate: new Date(g.targetDate).toLocaleDateString('en-IN'),
      status: g.isReached ? 'REACHED' : g.status.toUpperCase(),
    });
  });
  goalsSheet.getColumn('target').numFmt = '₹#,##0.00';
  goalsSheet.getColumn('saved').numFmt = '₹#,##0.00';

  return workbook;
}

/**
 * Generates printable PDF Financial Statement using PDFKit (DEC-011)
 * @param {string} userId
 * @param {object} res - Express response stream
 * @param {object} options - { startDate, endDate, monthYear }
 */
export async function streamPdfReport(userId, res, { startDate, endDate, monthYear } = {}) {
  const user = await User.findById(userId);
  const filter = { userId };

  if (monthYear) {
    const [year, month] = monthYear.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    filter.transactionDate = { $gte: start, $lte: end };
  } else if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) filter.transactionDate.$gte = new Date(startDate);
    if (endDate) filter.transactionDate.$lte = new Date(endDate);
  }

  const [accounts, transactions] = await Promise.all([
    Account.find({ userId, isArchived: false }),
    Transaction.find(filter)
      .populate('categoryId', 'name')
      .populate('accountId', 'name')
      .sort({ transactionDate: -1 })
      .limit(50),
  ]);

  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;

  transactions.forEach((tx) => {
    if (tx.type === TRANSACTION_TYPES.INCOME) totalIncomeMinor += tx.amountMinor;
    if (tx.type === TRANSACTION_TYPES.EXPENSE) totalExpenseMinor += tx.amountMinor;
  });

  const netCashFlowMinor = calculateNetCashFlow(totalIncomeMinor, totalExpenseMinor);
  const savingsRate = calculateSavingsRate(totalIncomeMinor, totalExpenseMinor);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  // Brand Header
  doc
    .fillColor('#047857')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('SmartSpend Financial Statement', { align: 'left' });

  doc
    .fillColor('#64748b')
    .fontSize(10)
    .font('Helvetica')
    .text('Personal Wealth Management & Multi-Account Ledger', { align: 'left' });

  doc.moveDown(0.5);
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.8);

  // Statement Metadata
  doc
    .fillColor('#1e293b')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(`Account Holder: `, { continued: true })
    .font('Helvetica')
    .text(`${user?.name || 'SmartSpend User'} (${user?.email || ''})`);

  doc
    .font('Helvetica-Bold')
    .text(`Statement Period: `, { continued: true })
    .font('Helvetica')
    .text(monthYear ? `Month ${monthYear}` : startDate && endDate ? `${startDate} to ${endDate}` : 'All Time History');

  doc
    .font('Helvetica-Bold')
    .text(`Generated On: `, { continued: true })
    .font('Helvetica')
    .text(new Date().toLocaleString('en-IN'));

  doc.moveDown(1);

  // Executive Summary Box
  doc
    .rect(40, doc.y, 515, 65)
    .fillAndStroke('#f8fafc', '#cbd5e1');

  const summaryTop = doc.y + 12;
  doc
    .fillColor('#047857')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('TOTAL INCOME', 55, summaryTop);
  doc
    .fillColor('#1e293b')
    .fontSize(14)
    .text(formatINR(totalIncomeMinor), 55, summaryTop + 15);

  doc
    .fillColor('#e11d48')
    .fontSize(9)
    .text('TOTAL EXPENSES', 185, summaryTop);
  doc
    .fillColor('#1e293b')
    .fontSize(14)
    .text(formatINR(totalExpenseMinor), 185, summaryTop + 15);

  doc
    .fillColor('#2563eb')
    .fontSize(9)
    .text('NET CASH FLOW', 315, summaryTop);
  doc
    .fillColor('#1e293b')
    .fontSize(14)
    .text(formatINR(netCashFlowMinor), 315, summaryTop + 15);

  doc
    .fillColor('#7c3aed')
    .fontSize(9)
    .text('SAVINGS RATE', 445, summaryTop);
  doc
    .fillColor('#1e293b')
    .fontSize(14)
    .text(`${savingsRate}%`, 445, summaryTop + 15);

  doc.y = summaryTop + 55;
  doc.moveDown(1);

  // Account Balances Section
  doc
    .fillColor('#0f172a')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Active Account Liquidity');
  doc.moveDown(0.3);

  accounts.forEach((acc) => {
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#334155')
      .text(`• ${acc.name} (${acc.accountType}): `, { continued: true })
      .font('Helvetica')
      .fillColor('#0f172a')
      .text(formatINR(acc.currentBalanceMinor));
  });

  doc.moveDown(1);

  // Recent Transactions Table
  doc
    .fillColor('#0f172a')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Recent Ledger Records');
  doc.moveDown(0.5);

  // Table Header
  const tableTop = doc.y;
  doc.rect(40, tableTop, 515, 20).fill('#f1f5f9');
  doc
    .fillColor('#475569')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('DATE', 45, tableTop + 6)
    .text('TYPE', 110, tableTop + 6)
    .text('DESCRIPTION', 165, tableTop + 6)
    .text('CATEGORY', 330, tableTop + 6)
    .text('AMOUNT', 460, tableTop + 6, { align: 'right', width: 90 });

  let rowY = tableTop + 22;
  const recentTx = transactions.slice(0, 15);

  recentTx.forEach((tx) => {
    const isIncome = tx.type === TRANSACTION_TYPES.INCOME;
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#334155')
      .text(new Date(tx.transactionDate).toLocaleDateString('en-IN'), 45, rowY)
      .text(tx.type.toUpperCase(), 110, rowY)
      .text(tx.description.substring(0, 28), 165, rowY)
      .text(tx.categoryId?.name || 'General', 330, rowY)
      .font('Helvetica-Bold')
      .fillColor(isIncome ? '#047857' : '#e11d48')
      .text(
        `${isIncome ? '+' : '-'}${formatINR(tx.amountMinor)}`,
        460,
        rowY,
        { align: 'right', width: 90 }
      );

    rowY += 18;
    if (rowY > 750) {
      doc.addPage();
      rowY = 50;
    }
  });

  // Footer Disclaimer
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(
      'SmartSpend Ledger Report — Generated with Integer Paise Monetary Precision (DEC-002).',
      40,
      800,
      { align: 'center', width: 515 }
    );

  doc.end();
}
