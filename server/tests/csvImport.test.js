import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Account } from '../src/models/Account.js';
import { Category } from '../src/models/Category.js';
import { Transaction } from '../src/models/Transaction.js';
import { ImportBatch } from '../src/models/ImportBatch.js';
import { Notification } from '../src/models/Notification.js';
import {
  sanitizeFormulaInjection,
  generateRowFingerprint,
  parseDateString,
  parseAmountMinor,
} from '../src/services/import/csvParser.js';

const TEST_DB_URI = 'mongodb://localhost:27017/smartspend_import_test';

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
  await ImportBatch.deleteMany({});
  await Notification.deleteMany({});
});

describe('Phase 9: CSV Bank Statement Ingestion & Export Pipeline (DEC-002, DEC-006, DEC-007)', () => {
  let user1, user2;
  let token1, token2;
  let acc1;
  let catGroceries;

  beforeEach(async () => {
    // 1. Register User 1
    const regRes1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Import Tester',
      email: 'import.tester@smartspend.io',
      password: 'Password123!',
    });
    token1 = regRes1.body.token;
    user1 = regRes1.body.user;

    // 2. Register User 2 (for BOLA testing)
    const regRes2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Other User',
      email: 'other.importer@smartspend.io',
      password: 'Password123!',
    });
    token2 = regRes2.body.token;
    user2 = regRes2.body.user;

    // Fetch categories for User 1
    const catsRes = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${token1}`);
    catGroceries = catsRes.body.categories.find((c) => c.name === 'Groceries');

    // Create an account for User 1 with ₹50,000.00 (5,000,000 paise)
    const accRes = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'HDFC Statement Account',
        accountType: 'savings',
        openingBalanceMinor: 5000000,
      });
    acc1 = accRes.body.account;
  });

  describe('Formula Injection Sanitization & Math Utilities (DEC-006, DEC-002)', () => {
    it('neutralizes formula injection strings starting with =, +, -, @ by prepending single quote', () => {
      expect(sanitizeFormulaInjection('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeFormulaInjection('+cmd|calc')).toBe("'+cmd|calc");
      expect(sanitizeFormulaInjection('-calc.exe')).toBe("'-calc.exe");
      expect(sanitizeFormulaInjection('@cmd|calc')).toBe("'@cmd|calc");
      // Standard text should remain unaltered
      expect(sanitizeFormulaInjection('Starbucks Coffee')).toBe('Starbucks Coffee');
      // Pure numbers with plus or minus should not be corrupted
      expect(sanitizeFormulaInjection('-150.50')).toBe('-150.50');
      expect(sanitizeFormulaInjection('+200')).toBe('+200');
    });

    it('generates consistent MD5 row fingerprints for deduplication', () => {
      const date = new Date('2026-11-05');
      const fp1 = generateRowFingerprint(date, 50000, acc1._id, 'Swiggy Order');
      const fp2 = generateRowFingerprint(date, 50000, acc1._id, '  swiggy order  ');
      expect(fp1).toBe(fp2);
      expect(fp1).toMatch(/^[a-f0-9]{32}$/);
    });

    it('parses multiple human date formats reliably', () => {
      const d1 = parseDateString('2026-11-05');
      expect(d1.toISOString().split('T')[0]).toBe('2026-11-05');

      const d2 = parseDateString('05/11/2026');
      expect(d2.getDate()).toBe(5);
      expect(d2.getMonth()).toBe(10); // November (0-indexed)

      const d3 = parseDateString('05-11-2026');
      expect(d3.getDate()).toBe(5);
    });

    it('cleans currency strings into integer minor paise amounts', () => {
      expect(parseAmountMinor('₹1,250.50')).toEqual({ amountMinor: 125050, isNegative: false });
      expect(parseAmountMinor('-500.00')).toEqual({ amountMinor: 50000, isNegative: true });
      expect(parseAmountMinor('(2,000.00)')).toEqual({ amountMinor: 200000, isNegative: true });
      expect(parseAmountMinor(45.5)).toEqual({ amountMinor: 4550, isNegative: false });
      expect(parseAmountMinor('invalid')).toBeNull();
    });
  });

  describe('Stage 1: CSV Preview Endpoint (DEC-006)', () => {
    it('parses CSV, sanitizes formula payloads, and detects duplicates against DB records', async () => {
      // 1. Pre-insert an existing transaction in DB to test deduplication
      await Transaction.create({
        userId: user1.id,
        accountId: acc1._id,
        amountMinor: 250000, // ₹2,500.00
        type: 'expense',
        description: 'Supermarket Groceries',
        transactionDate: new Date('2026-11-01T12:00:00.000Z'),
      });

      // 2. CSV containing:
      // Row 1: Existing transaction (duplicate)
      // Row 2: Malicious formula injection attempt (=cmd|' /C calc'!A0)
      // Row 3: Valid new income
      const csvContent = `Date,Description,Amount\n2026-11-01,Supermarket Groceries,-2500.00\n2026-11-02,=cmd|' /C calc'!A0,-150.00\n2026-11-03,Client Consulting Payment,15000.00`;

      const res = await request(app)
        .post('/api/v1/imports/csv/preview')
        .set('Authorization', `Bearer ${token1}`)
        .field('accountId', acc1._id.toString())
        .attach('file', Buffer.from(csvContent, 'utf-8'), 'statement.csv');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.preview.totalRows).toBe(3);
      expect(res.body.preview.duplicateCount).toBe(1); // Row 1 detected as duplicate
      expect(res.body.preview.validCount).toBe(2);

      // Verify Row 1 is flagged as duplicate
      const row1 = res.body.preview.previewRows[0];
      expect(row1.isDuplicate).toBe(true);
      expect(row1.amountMinor).toBe(250000);

      // Verify Row 2 had its formula payload neutralized with leading apostrophe
      const row2 = res.body.preview.previewRows[1];
      expect(row2.description).toBe("'=cmd|' /C calc'!A0");
      expect(row2.isDuplicate).toBe(false);
      expect(row2.amountMinor).toBe(15000);

      // Verify Row 3 is identified as Income
      const row3 = res.body.preview.previewRows[2];
      expect(row3.type).toBe('income');
      expect(row3.amountMinor).toBe(1500000); // ₹15,000.00
    });

    it('rejects preview referencing another user account with 404 (BOLA Defense)', async () => {
      const csvContent = `Date,Description,Amount\n2026-11-01,Coffee,-100.00`;

      const res = await request(app)
        .post('/api/v1/imports/csv/preview')
        .set('Authorization', `Bearer ${token2}`) // User 2 trying to upload to User 1's account
        .field('accountId', acc1._id.toString())
        .attach('file', Buffer.from(csvContent, 'utf-8'), 'statement.csv');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Stage 2: CSV Confirm & Ledger Commit (DEC-002, DEC-006)', () => {
    it('commits valid non-duplicate transactions, records ImportBatch, and mutates account balance', async () => {
      const initialBalance = acc1.openingBalanceMinor; // 5,000,000 paise (₹50,000.00)

      const rowsToConfirm = [
        {
          date: '2026-11-02T00:00:00.000Z',
          description: 'Airtel Bill Payment',
          amountMinor: 100000, // ₹1,000.00 expense
          type: 'expense',
          category: 'Utilities',
          isValid: true,
          isDuplicate: false,
        },
        {
          date: '2026-11-03T00:00:00.000Z',
          description: 'Quarterly Bonus',
          amountMinor: 2000000, // ₹20,000.00 income
          type: 'income',
          category: 'Salary',
          isValid: true,
          isDuplicate: false,
        },
        {
          date: '2026-11-01T00:00:00.000Z',
          description: 'Already Logged Transaction',
          amountMinor: 50000,
          type: 'expense',
          isValid: true,
          isDuplicate: true, // Duplicate!
        },
      ];

      const res = await request(app)
        .post('/api/v1/imports/csv/confirm')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          accountId: acc1._id.toString(),
          filename: 'hdfc_nov_2026.csv',
          rows: rowsToConfirm,
          skipDuplicates: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.importedCount).toBe(2);
      expect(res.body.skippedCount).toBe(1);
      expect(res.body.totalIncomeMinor).toBe(2000000);
      expect(res.body.totalExpenseMinor).toBe(100000);

      // Verify Account balance was mutated:
      // Initial: 5,000,000
      // Income: +2,000,000
      // Expense: -100,000
      // Expected = 6,900,000 paise (₹69,000.00)
      const updatedAcc = await Account.findById(acc1._id);
      expect(updatedAcc.currentBalanceMinor).toBe(6900000);

      // Verify ImportBatch document was created
      const batch = await ImportBatch.findById(res.body.batch._id);
      expect(batch).toBeTruthy();
      expect(batch.importedCount).toBe(2);
      expect(batch.skippedCount).toBe(1);
      expect(batch.status).toBe('completed');

      // Verify Transactions in DB have source 'csv_import'
      const createdTxs = await Transaction.find({ importBatchId: batch._id });
      expect(createdTxs.length).toBe(2);
      expect(createdTxs[0].source).toBe('csv_import');

      // Verify in-app audit notification
      const notif = await Notification.findOne({ relatedId: batch._id });
      expect(notif).toBeTruthy();
      expect(notif.title).toContain('Bank Statement Import Complete');
    });

    it('GET /api/v1/imports returns batch history', async () => {
      // Create a batch
      await ImportBatch.create({
        userId: user1.id,
        accountId: acc1._id,
        filename: 'icici_archive.csv',
        importedCount: 5,
        status: 'completed',
      });

      const res = await request(app)
        .get('/api/v1/imports')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.batches.length).toBe(1);
      expect(res.body.batches[0].filename).toBe('icici_archive.csv');
    });

    it('GET /api/v1/imports/csv/export downloads sanitized CSV', async () => {
      // Add a transaction
      await Transaction.create({
        userId: user1.id,
        accountId: acc1._id,
        amountMinor: 50000,
        type: 'expense',
        description: '=MALICIOUS_FORMULA',
        transactionDate: new Date('2026-11-05'),
      });

      const res = await request(app)
        .get('/api/v1/imports/csv/export')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      // Description must be sanitized in CSV export
      expect(res.text).toContain("'=MALICIOUS_FORMULA");
    });
  });
});
