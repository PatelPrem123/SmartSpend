import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';
import { Budget } from '../src/models/Budget.js';
import { Notification } from '../src/models/Notification.js';
import { evaluateBudgetsForUser } from '../src/services/budget/budgetEvaluator.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_budgets_test';

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
  await Budget.deleteMany({});
  await Notification.deleteMany({});
});

describe('Phase 6: Budget Management & Idempotent Threshold Alert Engine (DEC-002, DEC-004, DEC-007)', () => {
  let user1, user2;
  let token1, token2;
  let acc1;
  let catGroceries, catEntertainment;
  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  beforeEach(async () => {
    // 1. Register User 1
    const regRes1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Budget Master User',
      email: 'budget.master@smartspend.io',
      password: 'Password123!',
    });
    token1 = regRes1.body.token;
    user1 = regRes1.body.user;

    // 2. Register User 2 (for BOLA testing)
    const regRes2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Other Budget User',
      email: 'other.budget@smartspend.io',
      password: 'Password123!',
    });
    token2 = regRes2.body.token;
    user2 = regRes2.body.user;

    // Fetch categories for User 1
    const catsRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${token1}`);
    catGroceries = catsRes.body.categories.find((c) => c.name === 'Groceries');
    catEntertainment = catsRes.body.categories.find((c) => c.name === 'Entertainment');

    // Create an account for User 1 with ₹50,000.00 (5,000,000 paise)
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'HDFC Spendings',
        accountType: 'current',
        openingBalanceMinor: 5000000,
      });
    acc1 = accRes.body.account;
  });

  describe('Budget Creation & Validation (DEC-002, DEC-007)', () => {
    it('creates a category budget with integer paise amount limit', async () => {
      const res = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1000000, // ₹10,000.00
          notes: 'Groceries limit for this month',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.budget.amountLimitMinor).toBe(1000000);
      expect(res.body.budget.monthYear).toBe(currentMonthYear);
      expect(res.body.budget.isOverall).toBe(false);
      expect(res.body.budget.utilization).toBe(0);
      expect(res.body.budget.statusTier).toBe('safe');
    });

    it('creates an overall monthly budget (isOverall: true)', async () => {
      const res = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          isOverall: true,
          amountLimitMinor: 4000000, // ₹40,000.00
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.budget.isOverall).toBe(true);
      expect(res.body.budget.amountLimitMinor).toBe(4000000);
    });

    it('rejects floating-point budget amounts with 400 Bad Request (DEC-002)', async () => {
      const res = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1000.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects duplicate budgets for the same category and month with 409 Conflict', async () => {
      await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1000000,
        });

      const dupRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1500000,
        });

      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
    });

    it('rejects budget referencing another user category with 404 (BOLA Defense)', async () => {
      // User 2 trying to use User 1's category ID
      const res = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1000000,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Idempotent Threshold Alert Engine (DEC-004)', () => {
    it('progressively triggers 50%, 75%, 90%, 100% alerts idempotently without duplicates', async () => {
      // Create a budget of ₹10,000.00 (1,000,000 paise) for Groceries
      const budgetRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1000000, // ₹10,000
        });
      const budgetId = budgetRes.body.budget._id;

      // STEP 1: Add Expense of ₹4,000 (40% utilization) -> No alerts triggered
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 400000,
          accountId: acc1._id,
          categoryId: catGroceries._id,
          description: 'Week 1 Provisions',
        });

      let evaluated = await evaluateBudgetsForUser(user1.id);
      let targetBudget = evaluated.find((b) => b._id.toString() === budgetId.toString());
      expect(targetBudget.utilization).toBe(40);
      expect(targetBudget.alertThresholdsFired).toEqual([]);

      let notifs = await Notification.find({ userId: user1.id });
      expect(notifs.length).toBe(0);

      // STEP 2: Add Expense of ₹1,200 (Total = ₹5,200, 52% utilization) -> Triggers '50' Alert
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 120000,
          accountId: acc1._id,
          categoryId: catGroceries._id,
          description: 'Week 2 Groceries',
        });

      evaluated = await evaluateBudgetsForUser(user1.id);
      targetBudget = evaluated.find((b) => b._id.toString() === budgetId.toString());
      expect(targetBudget.utilization).toBe(52);
      expect(targetBudget.alertThresholdsFired).toContain('50');

      notifs = await Notification.find({ userId: user1.id });
      expect(notifs.length).toBe(1);
      expect(notifs[0].type).toBe('budget_alert');
      expect(notifs[0].severity).toBe('info');
      expect(notifs[0].title).toContain('50%');

      // STEP 3: Add Small Expense of ₹300 (Total = ₹5,500, 55% utilization)
      // Must NOT duplicate the 50% notification! (Idempotency guarantee DEC-004)
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 30000,
          accountId: acc1._id,
          categoryId: catGroceries._id,
          description: 'Snacks',
        });

      evaluated = await evaluateBudgetsForUser(user1.id);
      notifs = await Notification.find({ userId: user1.id });
      expect(notifs.length).toBe(1); // Still exactly 1!

      // STEP 4: Add Expense of ₹2,500 (Total = ₹8,000, 80% utilization) -> Triggers '75' Alert
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 250000,
          accountId: acc1._id,
          categoryId: catGroceries._id,
          description: 'Bulk Staples',
        });

      evaluated = await evaluateBudgetsForUser(user1.id);
      targetBudget = evaluated.find((b) => b._id.toString() === budgetId.toString());
      expect(targetBudget.utilization).toBe(80);
      expect(targetBudget.alertThresholdsFired).toContain('50');
      expect(targetBudget.alertThresholdsFired).toContain('75');

      notifs = await Notification.find({ userId: user1.id }).sort({ createdAt: 1 });
      expect(notifs.length).toBe(2);
      expect(notifs[1].title).toContain('75%');
      expect(notifs[1].severity).toBe('warning');

      // STEP 5: Add Expense of ₹2,500 (Total = ₹10,500, 105% utilization)
      // Jumps across both 90% and 100% tiers simultaneously
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          type: 'expense',
          amountMinor: 250000,
          accountId: acc1._id,
          categoryId: catGroceries._id,
          description: 'Party supplies',
        });

      evaluated = await evaluateBudgetsForUser(user1.id);
      targetBudget = evaluated.find((b) => b._id.toString() === budgetId.toString());
      expect(targetBudget.utilization).toBe(105);
      expect(targetBudget.statusTier).toBe('exceeded');
      expect(targetBudget.alertThresholdsFired).toEqual(
        expect.arrayContaining(['50', '75', '90', '100'])
      );

      notifs = await Notification.find({ userId: user1.id }).sort({ createdAt: 1 });
      expect(notifs.length).toBe(4);
      expect(notifs[2].title).toContain('90%');
      expect(notifs[3].title).toContain('100%+');
      expect(notifs[3].severity).toBe('critical');
    });
  });

  describe('Budget & Notification API Operations (DEC-007)', () => {
    it('GET /api/v1/budgets returns active evaluated budgets for specified month', async () => {
      // Create a budget
      await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 2000000,
        });

      const res = await request(app)
        .get(`/api/v1/budgets?monthYear=${currentMonthYear}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.budgets)).toBe(true);
      expect(res.body.budgets.length).toBe(1);
      expect(res.body.budgets[0].amountLimitMinor).toBe(2000000);
    });

    it('PATCH /api/v1/budgets/:id updates limit and recalculates progress', async () => {
      const budgetRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1000000,
        });
      const bId = budgetRes.body.budget._id;

      const updateRes = await request(app)
        .patch(`/api/v1/budgets/${bId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amountLimitMinor: 1500000, // ₹15,000
          notes: 'Increased allowance',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.budget.amountLimitMinor).toBe(1500000);
      expect(updateRes.body.budget.notes).toBe('Increased allowance');
    });

    it('DELETE /api/v1/budgets/:id removes budget cleanly', async () => {
      const budgetRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1000000,
        });
      const bId = budgetRes.body.budget._id;

      const delRes = await request(app)
        .delete(`/api/v1/budgets/${bId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const findRes = await request(app)
        .get(`/api/v1/budgets/${bId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(findRes.status).toBe(404);
    });

    it('GET, PATCH /api/v1/notifications manages alerts and read receipts', async () => {
      // Create dummy notifications
      await Notification.create([
        {
          userId: user1.id,
          title: 'Budget Alert 1',
          message: 'Alert msg 1',
          type: 'budget_alert',
        },
        {
          userId: user1.id,
          title: 'Budget Alert 2',
          message: 'Alert msg 2',
          type: 'budget_alert',
        },
      ]);

      const getRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${token1}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.notifications.length).toBe(2);
      expect(getRes.body.unreadCount).toBe(2);

      const firstNotifId = getRes.body.notifications[0]._id;

      // Mark single notification read
      const markSingleRes = await request(app)
        .patch(`/api/v1/notifications/${firstNotifId}/read`)
        .set('Authorization', `Bearer ${token1}`);

      expect(markSingleRes.status).toBe(200);
      expect(markSingleRes.body.notification.isRead).toBe(true);

      // Mark all read
      const markAllRes = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${token1}`);

      expect(markAllRes.status).toBe(200);
      expect(markAllRes.body.success).toBe(true);

      const finalRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${token1}`);
      expect(finalRes.body.unreadCount).toBe(0);
    });

    it('enforces tenant isolation: User 2 cannot access or mutate User 1 budgets', async () => {
      const budgetRes = await request(app)
        .post('/api/v1/budgets')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          monthYear: currentMonthYear,
          categoryId: catGroceries._id,
          amountLimitMinor: 1000000,
        });
      const bId = budgetRes.body.budget._id;

      // User 2 GET -> 404
      const alienGet = await request(app)
        .get(`/api/v1/budgets/${bId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(alienGet.status).toBe(404);

      // User 2 PATCH -> 404
      const alienPatch = await request(app)
        .patch(`/api/v1/budgets/${bId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ amountLimitMinor: 5000000 });
      expect(alienPatch.status).toBe(404);

      // User 2 DELETE -> 404
      const alienDel = await request(app)
        .delete(`/api/v1/budgets/${bId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(alienDel.status).toBe(404);
    });
  });
});
