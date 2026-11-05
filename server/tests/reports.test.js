import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_reports_export_test';

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

describe('Phase 11: Financial Reports & Streaming Document Export (DEC-002, DEC-010, DEC-011, DEC-007)', () => {
  let user1, user2;
  let token1, token2;
  let acc1;
  let catSalary, catGroceries;

  beforeEach(async () => {
    // 1. Register User 1
    const regRes1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Report Master User',
      email: 'reports.master@smartspend.io',
      password: 'Password123!',
    });
    token1 = regRes1.body.token;
    user1 = regRes1.body.user;

    // 2. Register User 2 (for BOLA isolation check)
    const regRes2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Other Report User',
      email: 'other.reports@smartspend.io',
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

    // Create account for User 1
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Report Checking Account',
        accountType: 'savings',
        openingBalanceMinor: 5000000, // ₹50,000.00
      });
    acc1 = accRes.body.account;

    // Seed test transactions
    // Income: ₹80,000 (8,000,000 paise)
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        accountId: acc1._id,
        categoryId: catSalary?._id,
        type: 'income',
        amountMinor: 8000000,
        description: 'Monthly Tech Salary',
        transactionDate: new Date().toISOString(),
      });

    // Expense: ₹25,000 (2,500,000 paise)
    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        accountId: acc1._id,
        categoryId: catGroceries?._id,
        type: 'expense',
        amountMinor: 2500000,
        description: 'Organic Supermarket Stockup',
        transactionDate: new Date().toISOString(),
      });
  });

  describe('Annual Summary Endpoint (DEC-002, DEC-010)', () => {
    it('returns 12 calendar months with exact integer paise net cash flow and savings rate', async () => {
      const currentYear = new Date().getFullYear();
      const res = await request(app)
        .get(`/api/v1/reports/annual-summary?year=${currentYear}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.year).toBe(currentYear);
      expect(res.body.months).toHaveLength(12);

      // Verify annual totals
      expect(res.body.annualTotals.totalIncomeMinor).toBe(8000000);
      expect(res.body.annualTotals.totalExpenseMinor).toBe(2500000);
      expect(res.body.annualTotals.netCashFlowMinor).toBe(5500000); // 80k - 25k = 55k in paise
      expect(res.body.annualTotals.savingsRate).toBe(68.8); // (55000 / 80000) * 100 = 68.75% rounded to 1 decimal place
    });
  });

  describe('Excel Export Endpoint (DEC-011)', () => {
    it('streams a multi-sheet .xlsx workbook with valid PK zip header', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export/excel')
        .set('Authorization', `Bearer ${token1}`)
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.xlsx');

      // Excel files (ZIP format) start with ASCII magic bytes "PK" (0x50, 0x4B)
      const buffer = Buffer.from(res.body);
      expect(buffer.length).toBeGreaterThan(100);
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
    });
  });

  describe('PDF Statement Export Endpoint (DEC-011)', () => {
    it('streams a printable PDF document with valid %PDF header', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export/pdf')
        .set('Authorization', `Bearer ${token1}`)
        .responseType('blob');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.pdf');

      // PDF files start with "%PDF"
      const buffer = Buffer.from(res.body);
      expect(buffer.length).toBeGreaterThan(100);
      const headerString = buffer.slice(0, 5).toString('ascii');
      expect(headerString).toContain('%PDF');
    });
  });

  describe('Multi-Tenant Data Isolation in Reports (DEC-007)', () => {
    it('ensures User 2 annual summary is completely isolated from User 1 records', async () => {
      const currentYear = new Date().getFullYear();
      const res = await request(app)
        .get(`/api/v1/reports/annual-summary?year=${currentYear}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      // User 2 has 0 transactions
      expect(res.body.annualTotals.totalIncomeMinor).toBe(0);
      expect(res.body.annualTotals.totalExpenseMinor).toBe(0);
      expect(res.body.annualTotals.netCashFlowMinor).toBe(0);
      expect(res.body.annualTotals.savingsRate).toBe(0); // Zero-division safe guard
    });
  });
});
