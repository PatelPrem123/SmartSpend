import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';
import { SavingsGoal } from '../src/models/SavingsGoal.js';
import { GoalContribution } from '../src/models/GoalContribution.js';
import { Notification } from '../src/models/Notification.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_goals_test';

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
  await SavingsGoal.deleteMany({});
  await GoalContribution.deleteMany({});
  await Notification.deleteMany({});
});

describe('Phase 10: Savings Goals & Goal Contributions (DEC-002, DEC-007, DEC-010)', () => {
  let user1, user2;
  let token1, token2;
  let acc1;

  beforeEach(async () => {
    // 1. Register User 1
    const regRes1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Goal Master User',
      email: 'goals.master@smartspend.io',
      password: 'Password123!',
    });
    token1 = regRes1.body.token;
    user1 = regRes1.body.user;

    // 2. Register User 2 (for BOLA testing)
    const regRes2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Other Goal User',
      email: 'other.goal@smartspend.io',
      password: 'Password123!',
    });
    token2 = regRes2.body.token;
    user2 = regRes2.body.user;

    // Create account for User 1 with ₹1,00,000 (10,000,000 paise)
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Savings Account',
        accountType: 'savings',
        openingBalanceMinor: 10000000,
      });
    acc1 = accRes.body.account;
  });

  describe('Savings Goal Creation & Validation (DEC-002, DEC-007)', () => {
    it('creates a savings goal with integer paise target amount (DEC-002)', async () => {
      const res = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Emergency Fund 2026',
          targetAmountMinor: 5000000, // ₹50,000.00 in paise
          targetDate: '2026-12-31',
          category: 'Emergency Fund',
          color: '#10b981',
          notes: '6 months living expenses',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Emergency Fund 2026');
      expect(res.body.data.targetAmountMinor).toBe(5000000);
      expect(res.body.data.currentAmountMinor).toBe(0);
      expect(res.body.data.isReached).toBe(false);
      expect(res.body.data.status).toBe('active');
    });

    it('rejects floating-point and negative target amounts with 400 Bad Request (DEC-002)', async () => {
      const floatRes = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Float Target Goal',
          targetAmountMinor: 50000.5,
          targetDate: '2026-12-31',
        });
      expect(floatRes.status).toBe(400);

      const negativeRes = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Negative Target Goal',
          targetAmountMinor: -10000,
          targetDate: '2026-12-31',
        });
      expect(negativeRes.status).toBe(400);
    });

    it('rejects goal creation with missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: '',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('Goal Contributions, Balances & Milestones (DEC-002, DEC-007, DEC-010)', () => {
    let goal;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'New Car Downpayment',
          targetAmountMinor: 2000000, // ₹20,000.00
          targetDate: '2026-12-31',
          category: 'Vehicle',
        });
      goal = res.body.data;
    });

    it('records a contribution from an account, mutates account balance, and creates ledger entry', async () => {
      const initialAcc = await Account.findById(acc1._id);
      expect(initialAcc.currentBalanceMinor).toBe(10000000);

      const contribRes = await request(app)
        .post(`/api/v1/goals/${goal._id}/contributions`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amountMinor: 500000, // ₹5,000.00
          accountId: acc1._id,
          notes: 'November bonus contribution',
        });

      expect(contribRes.status).toBe(201);
      expect(contribRes.body.success).toBe(true);
      expect(contribRes.body.data.goal.currentAmountMinor).toBe(500000);
      expect(contribRes.body.data.contribution.amountMinor).toBe(500000);

      // Verify account balance decreased atomically
      const updatedAcc = await Account.findById(acc1._id);
      expect(updatedAcc.currentBalanceMinor).toBe(10000000 - 500000); // 95,00,000 paise

      // Verify transaction was recorded
      const tx = await Transaction.findOne({ userId: user1.id, accountId: acc1._id });
      expect(tx).not.toBeNull();
      expect(tx.amountMinor).toBe(500000);
      expect(tx.description).toContain('Savings Goal: New Car Downpayment');
    });

    it('triggers milestone notifications at 50% and 100% completion', async () => {
      // 1. Contribute ₹10,000 (50% milestone)
      await request(app)
        .post(`/api/v1/goals/${goal._id}/contributions`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amountMinor: 1000000, // 50% of 20,00,000
          accountId: acc1._id,
        });

      let notifs = await Notification.find({ userId: user1.id });
      expect(notifs.length).toBe(2); // 25% and 50% notifications fired
      expect(notifs.some((n) => n.message.includes('50%'))).toBe(true);

      // 2. Contribute remaining ₹10,000 (100% milestone reached)
      const completeRes = await request(app)
        .post(`/api/v1/goals/${goal._id}/contributions`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amountMinor: 1000000,
          accountId: acc1._id,
        });

      expect(completeRes.body.data.goal.isReached).toBe(true);
      expect(completeRes.body.data.goal.status).toBe('completed');

      notifs = await Notification.find({ userId: user1.id });
      expect(notifs.some((n) => n.title.includes('🎉 Savings Goal Achieved'))).toBe(true);
    });

    it('reverses contribution, restores account balance and removes linked transaction cleanly', async () => {
      const contribRes = await request(app)
        .post(`/api/v1/goals/${goal._id}/contributions`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amountMinor: 500000,
          accountId: acc1._id,
        });

      const contributionId = contribRes.body.data.contribution._id;
      const accBeforeReverse = await Account.findById(acc1._id);
      expect(accBeforeReverse.currentBalanceMinor).toBe(9500000);

      // Delete contribution
      const delRes = await request(app)
        .delete(`/api/v1/goals/${goal._id}/contributions/${contributionId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.data.currentAmountMinor).toBe(0);

      // Verify account balance restored
      const accAfterReverse = await Account.findById(acc1._id);
      expect(accAfterReverse.currentBalanceMinor).toBe(10000000);

      // Verify transaction deleted
      const txCount = await Transaction.countDocuments({ userId: user1.id });
      expect(txCount).toBe(0);
    });

    it('rejects contribution referencing another user account with 404 (BOLA Defense)', async () => {
      // Create account for User 2
      const user2AccRes = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          name: 'User 2 Account',
          accountType: 'savings',
          openingBalanceMinor: 5000000,
        });
      const user2AccId = user2AccRes.body.account._id;

      // User 1 attempts to contribute from User 2's account
      const bolaRes = await request(app)
        .post(`/api/v1/goals/${goal._id}/contributions`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amountMinor: 100000,
          accountId: user2AccId,
        });

      expect(bolaRes.status).toBe(404);
      expect(bolaRes.body.error.code).toBe('ACCOUNT_NOT_FOUND');
    });
  });

  describe('Multi-Tenant BOLA Isolation (DEC-007)', () => {
    it('prevents User 2 from accessing, modifying, or deleting User 1 savings goal', async () => {
      const goalRes = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Secret Savings Goal',
          targetAmountMinor: 1000000,
          targetDate: '2026-12-31',
        });
      const goalId = goalRes.body.data._id;

      // User 2 GET by ID
      const getRes = await request(app)
        .get(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(getRes.status).toBe(404);

      // User 2 PATCH
      const patchRes = await request(app)
        .patch(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ name: 'Hacked Goal' });
      expect(patchRes.status).toBe(404);

      // User 2 DELETE
      const delRes = await request(app)
        .delete(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${token2}`);
      expect(delRes.status).toBe(404);

      // Verify User 1 goal is completely untouched
      const checkRes = await request(app)
        .get(`/api/v1/goals/${goalId}`)
        .set('Authorization', `Bearer ${token1}`);
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.goal.name).toBe('Secret Savings Goal');
    });
  });
});
