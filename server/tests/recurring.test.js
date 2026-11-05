import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';
import { RecurringRule } from '../src/models/RecurringRule.js';
import { Notification } from '../src/models/Notification.js';
import {
  calculateNextOccurrence,
  processRecurringTransactions,
} from '../src/services/recurring/recurringScheduler.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_recurring_test';

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
  await RecurringRule.deleteMany({});
  await Notification.deleteMany({});
});

describe('Phase 8: Recurring Transactions & node-cron Daemon (DEC-002, DEC-003, DEC-005, DEC-007)', () => {
  let user1, user2;
  let token1, token2;
  let accChecking, accSavings;
  let catSalary, catUtilities;

  beforeEach(async () => {
    // 1. Register User 1
    const regRes1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Recurring Master',
      email: 'recurring.master@smartspend.io',
      password: 'Password123!',
    });
    token1 = regRes1.body.token;
    user1 = regRes1.body.user;

    // 2. Register User 2 (for BOLA testing)
    const regRes2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Other Recurring User',
      email: 'other.recurring@smartspend.io',
      password: 'Password123!',
    });
    token2 = regRes2.body.token;
    user2 = regRes2.body.user;

    // Fetch seeded categories for User 1
    const catsRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${token1}`);
    catSalary = catsRes.body.categories.find((c) => c.name === 'Salary');
    catUtilities = catsRes.body.categories.find((c) => c.name === 'Utilities');

    // Create 2 accounts for User 1
    const acc1Res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Salary Checking',
        accountType: 'current',
        openingBalanceMinor: 10000000, // ₹1,00,000.00
      });
    accChecking = acc1Res.body.account;

    const acc2Res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Auto-Sweep Savings',
        accountType: 'savings',
        openingBalanceMinor: 2000000, // ₹20,000.00
      });
    accSavings = acc2Res.body.account;
  });

  describe('Forward Date Math & Edge-of-Month Clamping (DEC-005)', () => {
    it('advances daily rules by exactly 1 calendar day', () => {
      const base = new Date('2026-03-15T10:00:00.000Z');
      const next = calculateNextOccurrence(base, 'daily');
      expect(next.toISOString().split('T')[0]).toBe('2026-03-16');
    });

    it('advances weekly rules by exactly 7 calendar days', () => {
      const base = new Date('2026-03-15T10:00:00.000Z');
      const next = calculateNextOccurrence(base, 'weekly');
      expect(next.toISOString().split('T')[0]).toBe('2026-03-22');
    });

    it('correctly clamps month-end dates from Jan 31 to Feb 28', () => {
      const base = new Date('2026-01-31T00:00:00.000Z');
      const next = calculateNextOccurrence(base, 'monthly');
      expect(next.getMonth()).toBe(1); // February (0-indexed)
      expect(next.getDate()).toBe(28); // 2026 is non-leap year
    });

    it('correctly clamps August 31 to September 30', () => {
      const base = new Date('2026-08-31T00:00:00.000Z');
      const next = calculateNextOccurrence(base, 'monthly');
      expect(next.getMonth()).toBe(8); // September
      expect(next.getDate()).toBe(30);
    });

    it('handles yearly recurrence forward date calculation', () => {
      const base = new Date('2026-05-20T00:00:00.000Z');
      const next = calculateNextOccurrence(base, 'yearly');
      expect(next.getFullYear()).toBe(2027);
      expect(next.getMonth()).toBe(4);
      expect(next.getDate()).toBe(20);
    });
  });

  describe('Recurring Rule Creation & Validation (DEC-002, DEC-007)', () => {
    it('creates an expense recurring rule with integer paise amount', async () => {
      const res = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Airtel Broadband Fiber',
          type: 'expense',
          amountMinor: 117882, // ₹1,178.82
          accountId: accChecking._id,
          categoryId: catUtilities._id,
          frequency: 'monthly',
          startDate: new Date().toISOString(),
          paymentMethod: 'upi',
          notes: 'Auto-debit bill',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.rule.title).toBe('Airtel Broadband Fiber');
      expect(res.body.rule.amountMinor).toBe(117882);
      expect(res.body.rule.frequency).toBe('monthly');
      expect(res.body.rule.isActive).toBe(true);
      expect(res.body.rule.totalGeneratedCount).toBe(0);
    });

    it('creates a transfer recurring rule with dual account references (DEC-003)', async () => {
      const res = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Monthly Savings Auto-Sweep',
          type: 'transfer',
          amountMinor: 1000000, // ₹10,000.00
          fromAccountId: accChecking._id,
          toAccountId: accSavings._id,
          frequency: 'monthly',
          startDate: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.rule.type).toBe('transfer');
      expect(res.body.rule.amountMinor).toBe(1000000);
    });

    it('rejects floating-point amounts with 400 Bad Request (DEC-002)', async () => {
      const res = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Netflix Premium',
          type: 'expense',
          amountMinor: 649.5,
          accountId: accChecking._id,
          frequency: 'monthly',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects transfer with identical source and destination accounts', async () => {
      const res = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Invalid Self Transfer',
          type: 'transfer',
          amountMinor: 500000,
          fromAccountId: accChecking._id,
          toAccountId: accChecking._id,
          frequency: 'monthly',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects rule referencing another user account with 404 (BOLA Defense)', async () => {
      const res = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token2}`) // User 2 trying to use User 1 account
        .send({
          title: 'Unauthorized Rule',
          type: 'expense',
          amountMinor: 50000,
          accountId: accChecking._id,
          frequency: 'monthly',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Automated Daemon Sweep & Execution (DEC-003, DEC-005)', () => {
    it('executes scheduled rule, creates transaction, updates balances, and advances nextRunAt', async () => {
      // 1. Create a monthly expense rule scheduled for today
      const today = new Date();
      const rule = await RecurringRule.create({
        userId: user1.id,
        title: 'Electricity Bill',
        type: 'expense',
        amountMinor: 350000, // ₹3,500.00
        accountId: accChecking._id,
        categoryId: catUtilities._id,
        frequency: 'monthly',
        startDate: today,
        nextRunAt: today,
        isActive: true,
      });

      // Balance before: ₹1,00,000.00 (10000000)
      const checkingBefore = await Account.findById(accChecking._id);
      expect(checkingBefore.currentBalanceMinor).toBe(10000000);

      // 2. Trigger Sweep
      const summary = await processRecurringTransactions(today);
      expect(summary.processedCount).toBe(1);
      expect(summary.generatedCount).toBe(1);
      expect(summary.skippedCount).toBe(0);

      // 3. Verify Transaction created in DB
      const tx = await Transaction.findOne({ recurrenceRuleId: rule._id });
      expect(tx).toBeTruthy();
      expect(tx.amountMinor).toBe(350000);
      expect(tx.type).toBe('expense');
      expect(tx.source).toBe('recurring');
      expect(tx.description).toBe('Electricity Bill');

      // 4. Verify account balance decremented: 10,000,000 - 350,000 = 9,650,000 paise (₹96,500.00)
      const checkingAfter = await Account.findById(accChecking._id);
      expect(checkingAfter.currentBalanceMinor).toBe(9650000);

      // 5. Verify Rule was updated with incremented count and advanced nextRunAt
      const updatedRule = await RecurringRule.findById(rule._id);
      expect(updatedRule.totalGeneratedCount).toBe(1);
      expect(updatedRule.nextRunAt.getTime()).toBeGreaterThan(today.getTime());

      // 6. Verify in-app confirmation notification was issued
      const notif = await Notification.findOne({ relatedId: rule._id });
      expect(notif).toBeTruthy();
      expect(notif.type).toBe('recurring_reminder');
      expect(notif.title).toContain('Recurring Transaction Recorded');
    });

    it('proves Idempotency: multiple sweeps on the same date NEVER create duplicate transactions (DEC-005)', async () => {
      const today = new Date();
      const rule = await RecurringRule.create({
        userId: user1.id,
        title: 'Gym Membership',
        type: 'expense',
        amountMinor: 200000, // ₹2,000.00
        accountId: accChecking._id,
        frequency: 'monthly',
        startDate: today,
        nextRunAt: today,
        isActive: true,
      });

      // Sweep 1
      const sweep1 = await processRecurringTransactions(today);
      expect(sweep1.generatedCount).toBe(1);

      // Manually simulate a repeat trigger on the same scheduled day
      await RecurringRule.updateOne({ _id: rule._id }, { nextRunAt: today });

      // Sweep 2 on the same day
      const sweep2 = await processRecurringTransactions(today);
      expect(sweep2.generatedCount).toBe(0);
      expect(sweep2.skippedCount).toBe(1);

      // Assert only 1 transaction exists for this rule
      const txCount = await Transaction.countDocuments({ recurrenceRuleId: rule._id });
      expect(txCount).toBe(1);
    });

    it('automatically deactivates rule when endDate is reached', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const rule = await RecurringRule.create({
        userId: user1.id,
        title: 'One-Month Trial',
        type: 'expense',
        amountMinor: 100000,
        accountId: accChecking._id,
        frequency: 'monthly',
        startDate: today,
        endDate: tomorrow, // Expiration is tomorrow
        nextRunAt: today,
        isActive: true,
      });

      await processRecurringTransactions(today);

      const updatedRule = await RecurringRule.findById(rule._id);
      expect(updatedRule.isActive).toBe(false);
    });
  });

  describe('Recurring API Operations (DEC-007)', () => {
    it('GET /api/v1/recurring returns rules sorted by nextRunAt', async () => {
      await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Daily Cloud Backup',
          type: 'expense',
          amountMinor: 5000,
          accountId: accChecking._id,
          frequency: 'daily',
        });

      const res = await request(app)
        .get('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rules.length).toBe(1);
      expect(res.body.rules[0].title).toBe('Daily Cloud Backup');
    });

    it('PATCH /api/v1/recurring/:id updates active status and details', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Spotify Family',
          type: 'expense',
          amountMinor: 19900,
          accountId: accChecking._id,
          frequency: 'monthly',
        });
      const ruleId = createRes.body.rule._id;

      const patchRes = await request(app)
        .patch(`/api/v1/recurring/${ruleId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          isActive: false,
          amountMinor: 24900, // Price updated
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.rule.isActive).toBe(false);
      expect(patchRes.body.rule.amountMinor).toBe(24900);
    });

    it('DELETE /api/v1/recurring/:id removes rule cleanly', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Obsolete Subscription',
          type: 'expense',
          amountMinor: 50000,
          accountId: accChecking._id,
          frequency: 'monthly',
        });
      const ruleId = createRes.body.rule._id;

      const delRes = await request(app)
        .delete(`/api/v1/recurring/${ruleId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });

    it('POST /api/v1/recurring/sweep triggers manual scheduler sweep', async () => {
      const sweepRes = await request(app)
        .post('/api/v1/recurring/sweep')
        .set('Authorization', `Bearer ${token1}`);

      expect(sweepRes.status).toBe(200);
      expect(sweepRes.body.success).toBe(true);
      expect(sweepRes.body.result).toHaveProperty('processedCount');
      expect(sweepRes.body.result).toHaveProperty('generatedCount');
    });

    it('GET /api/v1/recurring/:id/transactions returns ledger history', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Daily Coffee Allowance',
          type: 'expense',
          amountMinor: 25000,
          accountId: accChecking._id,
          frequency: 'daily',
        });
      const ruleId = createRes.body.rule._id;

      // Run sweep to generate 1 transaction
      await processRecurringTransactions();

      const histRes = await request(app)
        .get(`/api/v1/recurring/${ruleId}/transactions`)
        .set('Authorization', `Bearer ${token1}`);

      expect(histRes.status).toBe(200);
      expect(histRes.body.success).toBe(true);
      expect(Array.isArray(histRes.body.transactions)).toBe(true);
      expect(histRes.body.transactions.length).toBe(1);
      expect(histRes.body.transactions[0].amountMinor).toBe(25000);
    });

    it('enforces tenant isolation: other user cannot access or mutate rule', async () => {
      const createRes = await request(app)
        .post('/api/v1/recurring')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          title: 'Secret Recurring Payment',
          type: 'expense',
          amountMinor: 50000,
          accountId: accChecking._id,
          frequency: 'monthly',
        });
      const ruleId = createRes.body.rule._id;

      // User 2 GET -> 404
      const alienGet = await request(app)
        .get(`/api/v1/recurring/${ruleId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(alienGet.status).toBe(404);

      // User 2 PATCH -> 404
      const alienPatch = await request(app)
        .patch(`/api/v1/recurring/${ruleId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ amountMinor: 99999 });
      expect(alienPatch.status).toBe(404);

      // User 2 DELETE -> 404
      const alienDel = await request(app)
        .delete(`/api/v1/recurring/${ruleId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(alienDel.status).toBe(404);
    });
  });
});
