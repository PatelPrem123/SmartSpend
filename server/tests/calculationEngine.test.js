import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';
import {
  getAccountDerivedBalance,
  getDashboardSummaryMetrics,
  getCategoryDistribution,
  getMonthlyCashFlowTimeSeries,
} from '../src/services/finance/calculationEngine.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_calculation_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Account.deleteMany({});
  await Category.deleteMany({});
  await Transaction.deleteMany({});
});

describe('Phase 5: Financial Calculation Engine (DEC-002, DEC-003, DEC-007)', () => {
  let user1, user2;
  let token1, token2;
  let accChecking, accSavings, accOtherUser;
  let catSalary, catGroceries;

  beforeEach(async () => {
    // 1. Register User 1
    const regRes1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Calculation Engine User',
      email: 'calc.user@smartspend.io',
      password: 'Password123!',
    });
    token1 = regRes1.body.token;
    user1 = regRes1.body.user;

    // 2. Register User 2
    const regRes2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Isolated Calc User',
      email: 'isolated.calc@smartspend.io',
      password: 'Password123!',
    });
    token2 = regRes2.body.token;
    user2 = regRes2.body.user;

    // Fetch categories for User 1
    const catsRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${token1}`);
    catSalary = catsRes.body.categories.find((c) => c.name === 'Salary');
    catGroceries = catsRes.body.categories.find((c) => c.name === 'Groceries');

    // Create 2 accounts for User 1
    // Checking: ₹10,000.00 = 1000000 paise
    const acc1Res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'HDFC Checking',
        accountType: 'current',
        openingBalanceMinor: 1000000,
      });
    accChecking = acc1Res.body.account;

    // Savings: ₹5,000.00 = 500000 paise
    const acc2Res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'ICICI Savings',
        accountType: 'savings',
        openingBalanceMinor: 500000,
      });
    accSavings = acc2Res.body.account;

    // Create account for User 2
    const accOtherRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        name: 'Other Bank',
        accountType: 'savings',
        openingBalanceMinor: 2000000,
      });
    accOtherUser = accOtherRes.body.account;
  });

  describe('Mathematical Precision & Ledger Derivation (DEC-002, DEC-003)', () => {
    it('accurately derives account balance from raw transactions: opening + income - expense + transfer_in - transfer_out', async () => {
      // 1. Add Income of ₹5,000 (500000 paise) to Checking
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'income',
          amountMinor: 500000,
          accountId: accChecking._id,
          categoryId: catSalary._id,
          description: 'Monthly Bonus',
        });

      // 2. Add Expense of ₹1,500 (150000 paise) from Checking
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 150000,
          accountId: accChecking._id,
          categoryId: catGroceries._id,
          description: 'Supermarket Groceries',
        });

      // 3. Transfer ₹2,000 (200000 paise) from Checking to Savings
      await request(app)
        .post('/api/v1/transactions/transfer')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fromAccountId: accChecking._id,
          toAccountId: accSavings._id,
          amountMinor: 200000,
          description: 'Emergency Fund Transfer',
        });

      // Derived Checking Balance:
      // Opening: 1,000,000
      // Income: +500,000
      // Expense: -150,000
      // Transfer Out: -200,000
      // Expected = 1,150,000 paise (₹11,500.00)
      const derivedChecking = await getAccountDerivedBalance(user1.id, accChecking._id);
      expect(derivedChecking).toBe(1150000);

      // Verify cached currentBalance in DB also matches derived balance
      const updatedCheckingAcc = await Account.findById(accChecking._id);
      expect(updatedCheckingAcc.currentBalanceMinor).toBe(1150000);

      // Derived Savings Balance:
      // Opening: 500,000
      // Transfer In: +200,000
      // Expected = 700,000 paise (₹7,000.00)
      const derivedSavings = await getAccountDerivedBalance(user1.id, accSavings._id);
      expect(derivedSavings).toBe(700000);

      const updatedSavingsAcc = await Account.findById(accSavings._id);
      expect(updatedSavingsAcc.currentBalanceMinor).toBe(700000);
    });

    it('proves Transfer Neutrality in dashboard metrics (DEC-003)', async () => {
      // Income = ₹10,000 (1000000 paise)
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'income',
          amountMinor: 1000000,
          accountId: accChecking._id,
          categoryId: catSalary._id,
          description: 'Full Salary',
        });

      // Expense = ₹3,000 (300000 paise)
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 300000,
          accountId: accChecking._id,
          categoryId: catGroceries._id,
          description: 'Monthly Provisions',
        });

      // Transfer = ₹4,000 (400000 paise)
      await request(app)
        .post('/api/v1/transactions/transfer')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          fromAccountId: accChecking._id,
          toAccountId: accSavings._id,
          amountMinor: 400000,
          description: 'Savings Transfer',
        });

      const metrics = await getDashboardSummaryMetrics(user1.id);

      // Income must be exactly ₹10,000.00 (1000000)
      expect(metrics.totalIncomeMinor).toBe(1000000);
      // Expense must be exactly ₹3,000.00 (300000)
      expect(metrics.totalExpenseMinor).toBe(300000);
      // Net Cash Flow = 1,000,000 - 300,000 = 700,000 (₹7,000.00)
      expect(metrics.netCashFlowMinor).toBe(700000);
      // Savings Rate = (700000 / 1000000) * 100 = 70.0%
      expect(metrics.savingsRate).toBe(70.0);
      // Total account balances across active accounts:
      // Checking: 1000000 + 1000000 - 300000 - 400000 = 1300000
      // Savings: 500000 + 400000 = 900000
      // Total = 2200000 paise (₹22,000.00)
      expect(metrics.totalAccountsBalanceMinor).toBe(2200000);
    });

    it('safely handles zero-income and negative cash flow edge cases', async () => {
      // User with 0 income, but ₹2,000 (200000 paise) expense
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 200000,
          accountId: accChecking._id,
          categoryId: catGroceries._id,
          description: 'Emergency grocery run',
        });

      const metrics = await getDashboardSummaryMetrics(user1.id);

      expect(metrics.totalIncomeMinor).toBe(0);
      expect(metrics.totalExpenseMinor).toBe(200000);
      expect(metrics.netCashFlowMinor).toBe(-200000);
      // Savings rate must be 0.0 with zero-income guard, not NaN or Infinity
      expect(metrics.savingsRate).toBe(0.0);
    });
  });

  describe('Category Distribution & Cash Flow Series', () => {
    it('computes category percentage distribution properly', async () => {
      // 1. ₹600 on Groceries
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 60000,
          accountId: accChecking._id,
          categoryId: catGroceries._id,
          description: 'Apples & Milk',
        });

      // 2. ₹400 on Groceries
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 40000,
          accountId: accChecking._id,
          categoryId: catGroceries._id,
          description: 'Rice & Oil',
        });

      const dist = await getCategoryDistribution(user1.id, null, null, 'expense');

      expect(dist.grandTotalMinor).toBe(100000); // ₹1,000.00
      expect(dist.items.length).toBe(1);
      expect(dist.items[0].categoryName).toBe('Groceries');
      expect(dist.items[0].totalMinor).toBe(100000);
      expect(dist.items[0].percentage).toBe(100);
    });

    it('generates gapless monthly time series array', async () => {
      const series = await getMonthlyCashFlowTimeSeries(user1.id, 4);

      expect(Array.isArray(series)).toBe(true);
      expect(series.length).toBe(4);
      series.forEach((monthItem) => {
        expect(monthItem).toHaveProperty('yearMonth');
        expect(monthItem).toHaveProperty('monthLabel');
        expect(monthItem).toHaveProperty('incomeMinor');
        expect(monthItem).toHaveProperty('expenseMinor');
        expect(monthItem).toHaveProperty('netCashFlowMinor');
      });
    });
  });

  describe('API Endpoints: Dashboard & Reports (DEC-007 Isolation)', () => {
    it('GET /api/v1/dashboard/summary returns metrics for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toHaveProperty('totalIncomeMinor');
      expect(res.body.summary).toHaveProperty('totalExpenseMinor');
      expect(res.body.summary).toHaveProperty('netCashFlowMinor');
      expect(res.body.summary).toHaveProperty('savingsRate');
      expect(res.body.summary).toHaveProperty('totalAccountsBalanceMinor');
    });

    it('GET /api/v1/reports/cashflow returns time series array', async () => {
      const res = await request(app)
        .get('/api/v1/reports/cashflow?months=6')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.cashFlowSeries)).toBe(true);
      expect(res.body.cashFlowSeries.length).toBe(6);
    });

    it('GET /api/v1/reports/categories returns category breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/reports/categories?type=expense')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.distribution).toHaveProperty('grandTotalMinor');
      expect(res.body.distribution).toHaveProperty('items');
    });

    it('GET /api/v1/reports/accounts/:accountId/derived-balance enforces tenant isolation', async () => {
      // User 1 checking own account
      const ownRes = await request(app)
        .get(`/api/v1/reports/accounts/${accChecking._id}/derived-balance`)
        .set('Authorization', `Bearer ${token1}`);

      expect(ownRes.status).toBe(200);
      expect(ownRes.body.success).toBe(true);
      expect(ownRes.body.derivedBalanceMinor).toBe(1000000);

      // User 2 attempting to access User 1's account derived balance -> 404
      const alienRes = await request(app)
        .get(`/api/v1/reports/accounts/${accChecking._id}/derived-balance`)
        .set('Authorization', `Bearer ${token2}`);

      expect(alienRes.status).toBe(404);
      expect(alienRes.body.success).toBe(false);
    });
  });
});
