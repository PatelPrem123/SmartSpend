# SmartSpend — Automated Testing & Quality Assurance Report (TESTING.md)

**Testing Framework:** Vitest v3.2.7 + Supertest v7.0.0  
**Test Coverage Standard:** Master AI Code Testing & Senior QA Contract (`AGENTS.md`)  
**Execution Status:** **12 Test Files Passed (112 / 112 Tests Passed, Exit Code 0)**

---

## 1. Testing Philosophy & Non-Negotiable Rules

1. **Never Assume Code is Correct:** All business logic, mathematical derivations, edge cases, and BOLA boundaries must be verified against actual code execution.
2. **Never Invent Test Results:** Only report tests that have been executed via terminal with verified output and exit code 0.
3. **Dedicated In-Memory / Staging Databases:** Every test suite connects to an isolated MongoDB database (`smartspend_*_test`) with complete database drop teardown (`afterAll`).
4. **Tenant Isolation Verification:** Every resource operation must test that User 2 receives `404 Not Found` or `403 Forbidden` when attempting to access or modify User 1 records.

---

## 2. Test Suites Summary Matrix

| # | Test Suite File | Domain Tested | Tests Passed | Status |
| :---: | :--- | :--- | :---: | :---: |
| 1 | `tests/auth.test.js` | User Registration, Password Hash, JWT Auth, Token Invalidation | 13 / 13 | **PASSED** |
| 2 | `tests/accounts.test.js` | Account Classification, Integer Opening Balances, BOLA Defense | 7 / 7 | **PASSED** |
| 3 | `tests/categories.test.js` | Category Taxonomy, Default System Seeding, Custom Categories | 6 / 6 | **PASSED** |
| 4 | `tests/transactions.test.js` | Income, Expense, Dual-Entry Transfer Neutrality, Atomic Balances | 10 / 10 | **PASSED** |
| 5 | `tests/calculationEngine.test.js` | Balance Derivation, Net Cash Flow, Zero-Income Safe Savings Rate | 9 / 9 | **PASSED** |
| 6 | `tests/budgets.test.js` | Category Caps, Idempotent 4-Tier Alerts (`50`, `75`, `90`, `100`) | 11 / 11 | **PASSED** |
| 7 | `tests/recurring.test.js` | node-cron Daemon, Edge-of-Month Clamping, Atomic Deduplication | 19 / 19 | **PASSED** |
| 8 | `tests/csvImport.test.js` | Formula Macro Sanitization, MD5 Row Fingerprints, Batch Commit | 9 / 9 | **PASSED** |
| 9 | `tests/goals.test.js` | Savings Goals, Milestone Alerts, Account Balance Debits | 8 / 8 | **PASSED** |
| 10 | `tests/reports.test.js` | 12-Month Annual Summary, Streaming ExcelJS, PDFKit Statements | 4 / 4 | **PASSED** |
| 11 | `tests/money.test.js` | Integer Paise Math, Formatting Utilities, Zero-Division Guard | 13 / 13 | **PASSED** |
| 12 | `tests/health.test.js` | Gateway Health Check, Service Diagnostics, Version Verification | 3 / 3 | **PASSED** |
| **TOTAL** | **12 Test Files** | **Full Application System Test Coverage** | **112 / 112** | **100% PASS** |

---

## 3. Verified Terminal Output

```bash
$ npm test

> smartspend-workspace@1.0.0 test
> npm --prefix server test

> smartspend-server@1.0.0 test
> vitest run

 RUN  v3.2.7 E:/vs code/All Main Main Projects/SmartSpend/server

 ✓ tests/transactions.test.js (10 tests) 10267ms
 ✓ tests/budgets.test.js (11 tests) 11254ms
 ✓ tests/recurring.test.js (19 tests) 15286ms
 ✓ tests/csvImport.test.js (9 tests) 9741ms
 ✓ tests/calculationEngine.test.js (9 tests) 7954ms
 ✓ tests/auth.test.js (13 tests) 4120ms
 ✓ tests/accounts.test.js (7 tests) 7234ms
 ✓ tests/goals.test.js (8 tests) 8519ms
 ✓ tests/reports.test.js (4 tests) 5061ms
 ✓ tests/money.test.js (13 tests) 40ms
 ✓ tests/health.test.js (3 tests) 42ms
 ✓ tests/categories.test.js (6 tests) 2882ms

 Test Files  12 passed (12)
      Tests  112 passed (112)
   Start at  18:25:52
   Duration  54.60s (transform 851ms, setup 0ms, collect 61.60s, tests 90.47s, environment 4ms, prepare 3.99s)
```

---

## 4. Key Edge Cases & Security Vectors Tested

### 1. Integer Currency Precision (DEC-002)
- Rejection of floating-point numbers: `targetAmountMinor: 5000.50` rejected with `400 Bad Request`.
- Rejection of negative numbers: `amountMinor: -1000` rejected with `400 Bad Request`.
- Precision determinism: Summing $1,000,000$ transactions preserves exact integer mathematical precision without rounding drifts.

### 2. Dual-Entry Transfer Neutrality (DEC-003)
- Tested inter-account transfer of ₹5,000 from Savings to UPI Wallet.
- Symmetrical balance mutation verified: Source decreased by 500,000 paise, destination increased by 500,000 paise.
- Asserted that monthly Net Cash Flow remained completely unaffected (zero income or expense inflation).

### 3. Zero-Income Safe Savings Rate (DEC-010)
- Tested user with ₹0 income and ₹50,000 expenses.
- Asserted savings rate returned clean `0%` rather than crashing with `NaN` or `-Infinity`.

### 4. CSV Formula Macro Injection Defense (DEC-006)
- Tested malicious CSV cells starting with `=CMD|' /C calc'!A0`, `+cmd`, `-cmd`, and `@SUM(1+1)`.
- Asserted that all cells are sanitized by prepending a single quote (`'`), neutralizing DDE exploits in Microsoft Excel and LibreOffice.

### 5. Calendar Edge-of-Month Clamping (DEC-005)
- Tested Jan 31 recurring rule advancing to February.
- Asserted that the date clamped cleanly to February 28 (and February 29 on leap year 2028), avoiding standard JavaScript rollover into March.

### 6. BOLA / IDOR Tenant Isolation (DEC-007)
- Tested User 2 attempting to view, edit, or delete User 1 accounts, transactions, budgets, goals, and recurring rules.
- Asserted that all cross-user requests are rejected with `404 Not Found` (defending against enumeration) and database records remain immutable.

### 7. Brute-Force & Denial-of-Service Rate Limiting (DEC-007 / OWASP A07)
- Dedicated `authLimiter` on `POST /api/v1/auth/login` and `POST /api/v1/auth/register` (max 10 requests / 15 minutes per IP).
- Dedicated `fileOpsLimiter` on `POST /api/v1/imports/csv/*` and `GET /api/v1/reports/export/*` (max 30 requests / 1 minute per IP).
- Automated test runs bypass throttling cleanly via `skip: () => env.NODE_ENV === 'test'`.

### 8. File Upload Protection & Multer Error Handling (OWASP A04)
- Multi-tier defense against oversized or malicious file uploads.
- Catching `MulterError` and `LIMIT_FILE_SIZE` (5MB ceiling) both at router-level wrapper and global `errorHandler.js`, returning structured HTTP 400 Bad Request JSON envelopes.

### 9. Frontend Production Bundle Optimization & Code-Splitting
- All 12 page routes asynchronously code-split via `React.lazy()` with `<React.Suspense fallback={<PageLoader />}>`.
- Rollup vendor chunking (`vendor-charts`, `vendor-icons`, `vendor-state`, `vendor-core`).
- Verified zero Vite chunk size warnings; largest chunk reduced from 907 kB to 324 kB (106 kB gzip).

---

## 5. How to Run QA Commands

```bash
# Run all 12 test suites once
npm test

# Run specific suite
npm --prefix server test tests/goals.test.js

# Run tests in watch mode during development
npm --prefix server run test:watch

# Build and verify frontend client bundle
npm --prefix client run build
```
