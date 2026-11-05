import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_transactions_test';

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

describe('Phase 4: Income, Expense & Dual-Entry Transfer Management (DEC-002, DEC-003, DEC-007)', () => {
  let userToken;
  let otherUserToken;
  let savingsAccount;
  let walletAccount;
  let otherUserAccount;
  let salaryCategory;
  let foodCategory;

  beforeEach(async () => {
    // 1. Register User 1
    const reg1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Vikram Seth',
      email: 'vikram.seth@example.com',
      password: 'Password123!',
    });
    userToken = reg1.body.token;

    // Fetch seeded categories for User 1
    const catRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${userToken}`);
    salaryCategory = catRes.body.categories.find((c) => c.name === 'Salary');
    foodCategory = catRes.body.categories.find((c) => c.name === 'Food & Dining');

    // Create 2 accounts for User 1
    const acc1 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'HDFC Savings',
        accountType: 'savings',
        openingBalanceMinor: 10000000, // ₹1,00,000.00
      });
    savingsAccount = acc1.body.account;

    const acc2 = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'PhonePe Wallet',
        accountType: 'wallet',
        openingBalanceMinor: 500000, // ₹5,000.00
      });
    walletAccount = acc2.body.account;

    // 2. Register User 2 (for BOLA testing)
    const reg2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Maya Rao',
      email: 'maya.rao@example.com',
      password: 'Password123!',
    });
    otherUserToken = reg2.body.token;

    const accOther = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        name: 'Maya Vault',
        accountType: 'savings',
        openingBalanceMinor: 50000000,
      });
    otherUserAccount = accOther.body.account;
  });

  describe('POST /api/v1/transactions (Income & Expense)', () => {
    it('records income transaction and atomically increases account balance', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'income',
          amountMinor: 8500000, // ₹85,000.00
          accountId: savingsAccount._id,
          categoryId: salaryCategory._id,
          description: 'Monthly Corporate Salary',
          paymentMethod: 'net_banking',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction.amountMinor).toBe(8500000);
      expect(res.body.transaction.type).toBe('income');

      // Verify account balance increased: ₹1,00,000 + ₹85,000 = ₹1,85,000
      const updatedAcc = await Account.findById(savingsAccount._id);
      expect(updatedAcc.currentBalanceMinor).toBe(18500000);
    });

    it('records expense transaction and atomically decreases account balance', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'expense',
          amountMinor: 125000, // ₹1,250.00
          accountId: walletAccount._id,
          categoryId: foodCategory._id,
          description: 'Team Dinner at Restaurant',
          paymentMethod: 'upi',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify account balance decreased: ₹5,000 - ₹1,250 = ₹3,750
      const updatedAcc = await Account.findById(walletAccount._id);
      expect(updatedAcc.currentBalanceMinor).toBe(375000);
    });

    it('rejects floating-point and negative amounts with 400 Bad Request (DEC-002)', async () => {
      const floatRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'expense',
          amountMinor: 1250.5, // Float
          accountId: walletAccount._id,
          description: 'Float test',
        });
      expect(floatRes.status).toBe(400);

      const negativeRes = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'expense',
          amountMinor: -5000,
          accountId: walletAccount._id,
          description: 'Negative test',
        });
      expect(negativeRes.status).toBe(400);
    });
  });

  describe('POST /api/v1/transactions/transfer (Dual-Entry Transfer Neutrality - DEC-003)', () => {
    it('executes atomic transfer: source decreases, destination increases', async () => {
      // Transfer ₹2,000 (200000 paise) from Savings to Wallet
      const res = await request(app)
        .post('/api/v1/transactions/transfer')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fromAccountId: savingsAccount._id,
          toAccountId: walletAccount._id,
          amountMinor: 200000, // ₹2,000.00
          description: 'ATM Wallet Top-up',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction.type).toBe('transfer');
      expect(res.body.transaction.amountMinor).toBe(200000);

      // Verify balances updated symmetrically
      const [updatedSavings, updatedWallet] = await Promise.all([
        Account.findById(savingsAccount._id),
        Account.findById(walletAccount._id),
      ]);

      // Savings: ₹1,00,000 - ₹2,000 = ₹98,000
      expect(updatedSavings.currentBalanceMinor).toBe(9800000);
      // Wallet: ₹5,000 + ₹2,000 = ₹7,000
      expect(updatedWallet.currentBalanceMinor).toBe(700000);
    });

    it('rejects transfer between the same account with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/transactions/transfer')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fromAccountId: savingsAccount._id,
          toAccountId: savingsAccount._id,
          amountMinor: 50000,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Validation Error');
    });

    it('rejects transfer referencing another user account with 404 (BOLA Defense)', async () => {
      const res = await request(app)
        .post('/api/v1/transactions/transfer')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          fromAccountId: savingsAccount._id,
          toAccountId: otherUserAccount._id, // User 2's account
          amountMinor: 500000,
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found or access unauthorized');
    });
  });

  describe('GET, PATCH & DELETE /api/v1/transactions/:id', () => {
    let testTransactionId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'expense',
          amountMinor: 300000, // ₹3,000.00
          accountId: walletAccount._id,
          description: 'Grocery Run',
        });
      testTransactionId = res.body.transaction._id;
    });

    it('retrieves paginated transactions with type filter', async () => {
      const res = await request(app)
        .get('/api/v1/transactions?type=expense')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.transactions[0].description).toBe('Grocery Run');
    });

    it('updates transaction amount and adjusts account balance delta', async () => {
      // Wallet was ₹5,000 - ₹3,000 = ₹2,000
      // Update expense from ₹3,000 to ₹4,000 (delta = +₹1,000 expense, wallet should become ₹1,000)
      const updateRes = await request(app)
        .patch(`/api/v1/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amountMinor: 400000, // ₹4,000.00
          description: 'Supermarket Big Grocery Run',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.transaction.amountMinor).toBe(400000);

      const wallet = await Account.findById(walletAccount._id);
      expect(wallet.currentBalanceMinor).toBe(100000); // ₹1,000.00 remaining
    });

    it('deletes transaction and restores account balance', async () => {
      // Deleting the ₹3,000 expense should restore wallet back to ₹5,000
      const delRes = await request(app)
        .delete(`/api/v1/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(delRes.status).toBe(200);

      const wallet = await Account.findById(walletAccount._id);
      expect(wallet.currentBalanceMinor).toBe(500000); // Restored to ₹5,000.00
    });

    it('enforces tenant isolation: other user cannot access or delete transaction', async () => {
      const attackGet = await request(app)
        .get(`/api/v1/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(attackGet.status).toBe(404);

      const attackDel = await request(app)
        .delete(`/api/v1/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(attackDel.status).toBe(404);
    });
  });
});
