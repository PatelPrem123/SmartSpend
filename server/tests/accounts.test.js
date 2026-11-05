import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_accounts_test';

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
});

describe('Phase 3: Accounts Management (DEC-002, DEC-007, DEC-008)', () => {
  let userToken;
  let otherUserToken;

  beforeEach(async () => {
    // Create primary user
    const reg1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Rohan Mehra',
      email: 'rohan.mehra@example.com',
      password: 'Password123!',
    });
    userToken = reg1.body.token;

    // Create second user for BOLA testing
    const reg2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Ananya Verma',
      email: 'ananya.verma@example.com',
      password: 'Password123!',
    });
    otherUserToken = reg2.body.token;
  });

  describe('POST /api/v1/accounts', () => {
    it('creates an account with integer paise opening balance (DEC-002)', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'HDFC Salary Account',
          accountType: 'savings',
          openingBalanceMinor: 25000000, // ₹2,50,000.00
          color: '#059669',
          icon: 'Building2',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.account.name).toBe('HDFC Salary Account');
      expect(res.body.account.accountType).toBe('savings');
      expect(res.body.account.openingBalanceMinor).toBe(25000000);
      expect(res.body.account.currentBalanceMinor).toBe(25000000);
      expect(res.body.account.isArchived).toBe(false);
    });

    it('rejects floating-point opening balances with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Paytm Wallet',
          accountType: 'wallet',
          openingBalanceMinor: 1500.75, // Invalid float
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Validation Error');
    });

    it('rejects duplicate account names for the same user with 409 Conflict', async () => {
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Emergency Fund',
          accountType: 'emergency_fund',
          openingBalanceMinor: 10000000,
        });

      const duplicateRes = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Emergency Fund',
          accountType: 'savings',
          openingBalanceMinor: 5000000,
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error).toContain('already exists');
    });
  });

  describe('GET /api/v1/accounts & BOLA Isolation', () => {
    it('returns only the accounts belonging to the authenticated user', async () => {
      // User 1 creates 2 accounts
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Cash In Hand',
          accountType: 'cash',
          openingBalanceMinor: 500000, // ₹5,000.00
        });

      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'ICICI Savings',
          accountType: 'savings',
          openingBalanceMinor: 15000000, // ₹1,50,000.00
        });

      // User 2 creates 1 account
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: 'SBI Checking',
          accountType: 'current',
          openingBalanceMinor: 2000000,
        });

      // User 1 lists accounts
      const res1 = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res1.status).toBe(200);
      expect(res1.body.count).toBe(2);
      expect(res1.body.accounts.some((a) => a.name === 'Cash In Hand')).toBe(true);
      expect(res1.body.accounts.some((a) => a.name === 'SBI Checking')).toBe(false);
    });

    it('rejects access to another user account by ID with 404 (BOLA Defense)', async () => {
      // User 2 creates account
      const createRes = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: 'Private Vault',
          accountType: 'savings',
          openingBalanceMinor: 9999900,
        });

      const otherAccountId = createRes.body.account._id;

      // User 1 attempts to fetch User 2's account ID
      const attackRes = await request(app)
        .get(`/api/v1/accounts/${otherAccountId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(attackRes.status).toBe(404);
      expect(attackRes.body.error).toContain('not found or access unauthorized');
    });
  });

  describe('PATCH & DELETE (Archive) /api/v1/accounts/:id', () => {
    it('updates account metadata correctly', async () => {
      const createRes = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'PhonePe Wallet',
          accountType: 'wallet',
          openingBalanceMinor: 200000,
        });

      const accountId = createRes.body.account._id;

      const updateRes = await request(app)
        .patch(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Primary PhonePe UPI',
          color: '#10b981',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.account.name).toBe('Primary PhonePe UPI');
      expect(updateRes.body.account.color).toBe('#10b981');
    });

    it('soft-archives account and excludes it from standard list', async () => {
      const createRes = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Old Axis Bank',
          accountType: 'savings',
          openingBalanceMinor: 0,
        });

      const accountId = createRes.body.account._id;

      // Archive account
      const deleteRes = await request(app)
        .delete(`/api/v1/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify omitted from active accounts list
      const listActive = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userToken}`);
      expect(listActive.body.accounts.some((a) => a._id === accountId)).toBe(false);

      // Verify included when includeArchived=true
      const listAll = await request(app)
        .get('/api/v1/accounts?includeArchived=true')
        .set('Authorization', `Bearer ${userToken}`);
      expect(listAll.body.accounts.some((a) => a._id === accountId)).toBe(true);
    });
  });
});
