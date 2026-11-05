# SmartSpend — System Impact Map (IMPACT-MAP.md)

**System:** SmartSpend (Personal Finance, Multi-Account Ledger & Analytics Platform)  
**Evaluated Architecture:** Decoupled 3-Tier SaaS (React 18 SPA + Node.js Express REST API v1 + MongoDB 7.x)  
**Maintenance Rule:** This document maps verified dependencies and ripples across the codebase. Review this document BEFORE modifying any shared service, controller, model, middleware, or cron job.

---

## 1. Purpose

This Impact Map protects SmartSpend against:
1. **Financial Ledger Discrepancies:** Breaking integer currency precision or introducing floating-point math.
2. **Transfer Distortion:** Accidentally treating inter-account transfers as income or expense, ruining user analytics.
3. **Cross-Tenant Data Breaches (BOLA/IDOR):** Inadvertently omitting `userId: req.user.id` filters in queries or updates.
4. **Duplicate Alert Floods:** Breaking idempotent array tracking in budget threshold alerts.
5. **CSV Macro Exploits:** Bypassing formula injection sanitization during bank statement ingestion.
6. **Cron Race Conditions:** Firing duplicate recurring transactions or corrupting forward calendar math.

Whenever an engineer or AI agent modifies a core file or function, this map provides an auditable, pre-verified breakdown of direct and indirect consumers, security boundaries, and required tests.

---

## 2. Component Impact Maps

### Component 1: `server/src/services/finance/calculationEngine.js` → `calculateAccountBalance()`, `calculateNetCashFlow()`, `calculateSavingsRate()`
- **Role:** Centralized financial engine performing integer paise math, dynamic balance derivation, net cash flow calculations, and zero-income guarded savings rate calculations.
- **Directly affected:**
  - `server/src/controllers/accountController.js` (`getAccounts`, `getAccountById`)
  - `server/src/controllers/dashboardController.js` (`getDashboardSummary`)
  - `server/src/controllers/reportsController.js` (`getCashflowReport`, `getCategoryDistribution`)
- **Potentially affected:**
  - `client/src/features/dashboard/DashboardPage.jsx` (summary stat cards, net cash flow metrics).
  - `client/src/features/accounts/AccountCard.jsx` (displayed balance).
  - `server/src/services/reports/exportService.js` (Excel workbook overview sheet).
- **API impact:** Affects `GET /api/v1/accounts`, `GET /api/v1/dashboard/summary`, `GET /api/v1/reports/cashflow`. Changing output contracts breaks TanStack Query cache bindings in the client SPA.
- **Data impact:** Reads from `Transaction` and `Account` collections. Must maintain strict exclusion of `type: 'transfer'` from income/expense sums.
- **Security impact:** Must strictly scope all aggregation pipelines with `$match: { userId: new ObjectId(userId) }`.
- **Runtime impact:** Executes on dashboard load and account balance queries; must utilize indexed fields (`userId`, `transactionDate`, `type`).
- **Frontend impact:** Updates Recharts line curves, net worth indicators, and savings progress dials.
- **Tests to review:** `server/tests/calculationEngine.test.js`, `server/tests/transferNeutrality.test.js`, `server/tests/zeroIncomeGuard.test.js`.
- **Infrastructure impact:** None. Aggregations run within MongoDB cluster memory limits.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 3: Mathematical Ledger Formulation & Integer Currency; Chapter 5).

---

### Component 2: `server/src/services/finance/transferService.js` → `executeAtomicTransfer()`
- **Role:** Executes atomic dual-entry inter-account transfers (e.g. ₹2,000 from Savings to UPI Wallet), creating a single atomic document with `type: 'transfer'`, `fromAccountId`, and `toAccountId`.
- **Directly affected:**
  - `server/src/controllers/transactionController.js` (`createTransfer`)
  - `server/src/models/Transaction.js`
  - `server/src/models/Account.js`
- **Potentially affected:**
  - `client/src/features/accounts/TransferModal.jsx` (transfer submission form).
  - `client/src/features/transactions/TransactionTable.jsx` (renders transfer rows with neutral badges).
  - `server/src/services/finance/calculationEngine.js` (balance rollups for both accounts).
- **API impact:** `POST /api/v1/transactions/transfer`. Expects `{ fromAccountId, toAccountId, amountMinor, description, transactionDate }`. Returns `{ success: true, transaction }`.
- **Data impact:** Mutates single `Transaction` document and adjusts both `Account` balances simultaneously. Both accounts must belong to `req.user.id`.
- **Security impact:** Critical. Must verify BOTH `fromAccountId` AND `toAccountId` belong to the authenticated user. Rejects transfer if an attacker specifies another user's account ID (`403 Forbidden`).
- **Runtime impact:** Employs MongoDB atomic session transaction or sequential atomic `$inc` updates to prevent partial state corruption.
- **Frontend impact:** Invalidates TanStack Query keys `['accounts']` and `['transactions']`, triggering instantaneous UI refresh.
- **Tests to review:** `server/tests/transferService.test.js`, `server/tests/bolaDefense.test.js`.
- **Infrastructure impact:** None.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 4: Multi-Account Management & Dual-Entry Transfers).

---

### Component 3: `server/src/services/budget/budgetEvaluator.js` → `evaluateBudgetUtilization()` & `triggerThresholdAlert()`
- **Role:** Calculates monthly category expenditure against defined budget limits and idempotently fires in-app notifications when utilization crosses 50%, 75%, 90%, or 100% without duplicate alert spam.
- **Directly affected:**
  - `server/src/controllers/transactionController.js` (`createTransaction`, `updateTransaction`, `deleteTransaction`)
  - `server/src/models/Budget.js` (`alertThresholdsFired` array)
  - `server/src/models/Notification.js`
- **Potentially affected:**
  - `client/src/features/budgets/BudgetCard.jsx` (progress bar color: Green → Amber → Orange → Red).
  - `client/src/components/layout/NotificationBell.jsx` (unread alert count badge).
- **API impact:** Runs asynchronously as a side effect of transaction creation/updates. Also queried via `GET /api/v1/budgets`.
- **Data impact:** Appends threshold strings to `Budget.alertThresholdsFired`. Creates documents in `Notification`.
- **Security impact:** Scoped to `userId`. Alerts must never leak details from other users.
- **Runtime impact:** Non-blocking async execution after transaction write. Must not delay the HTTP response of transaction creation.
- **Frontend impact:** Real-time visual progress bar color shifts and instant notification toast triggers.
- **Tests to review:** `server/tests/budgetAlerts.test.js`, `server/tests/budgetThresholdIdempotency.test.js`.
- **Infrastructure impact:** None.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 5: Category-Based Budgeting & Non-Duplicate Alerts).

---

### Component 4: `server/src/jobs/recurringCron.js` / `recurringScheduler.js` → `processDueRecurringRules()`
- **Role:** Daily background scheduler (`00:01:00 UTC`) detecting active recurring rules, executing idempotency checks, generating synthetic transactions with `source: 'recurring'`, and calculating the next execution timestamp.
- **Directly affected:**
  - `server/src/models/RecurringRule.js`
  - `server/src/models/Transaction.js`
  - `server/src/models/Notification.js`
- **Potentially affected:**
  - `client/src/features/recurring/RecurringBillList.jsx` (upcoming bills horizon).
  - `client/src/features/dashboard/DashboardPage.jsx` (upcoming cash commitments).
- **API impact:** Internal worker. Exposes manual trigger for testing: `POST /api/v1/recurring/trigger-due` (Admin/Testing only).
- **Data impact:** Inserts new `Transaction` documents and advances `RecurringRule.nextRunAt`.
- **Security impact:** Daemon runs in system context but must maintain user-level data boundaries.
- **Runtime impact:** Runs once daily. Must handle large batches without memory exhaustion by utilizing MongoDB cursors.
- **Frontend impact:** Adds transactions to user's feed upon their next login or polling cycle.
- **Tests to review:** `server/tests/recurringCron.test.js`, `server/tests/forwardDateMath.test.js`.
- **Infrastructure impact:** Keeps the server process active; requires stable system time and UTC configuration.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 6: Automated Recurring Transaction Scheduler).

---

### Component 5: `server/src/imports/csvParser.js` → `parseBankStatementCsv()` & `sanitizeCsvCell()`
- **Role:** Streams uploaded bank statement CSV files, sanitizes formula macro injection strings (`=`, `+`, `-`, `@`), maps header columns, and computes MD5 fingerprints for deduplication.
- **Directly affected:**
  - `server/src/controllers/importController.js` (`previewCsvImport`, `confirmCsvImport`)
  - `server/src/models/ImportBatch.js`
  - `server/src/models/Transaction.js`
- **Potentially affected:**
  - `client/src/features/imports/CsvUploadModal.jsx` (drag-and-drop file upload).
  - `client/src/features/imports/ImportPreviewTable.jsx` (shows duplicate flags and parsed rows).
- **API impact:** `POST /api/v1/imports/csv/preview` (returns parsed preview with duplicate flags) and `POST /api/v1/imports/csv/confirm` (batch commits approved rows).
- **Data impact:** Creates `ImportBatch` document and batch-inserts validated `Transaction` records with `importBatchId`.
- **Security impact:** Critical. Defends against CSV Formula Macro Injection, file upload size exhaustion (max 5MB limit), and malicious MIME types.
- **Runtime impact:** Streams files using Papa Parse; does not load entire multi-megabyte files into unconstrained memory buffers.
- **Frontend impact:** Displays interactive table where users can uncheck flagged duplicate rows before committing.
- **Tests to review:** `server/tests/csvSanitization.test.js`, `server/tests/csvFingerprintDeduplication.test.js`.
- **Infrastructure impact:** Temporary file buffer stored in memory or `/tmp` disk storage with automatic cleanup on completion.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 7: Bank Statement CSV Ingestion & Deduplication; Chapter 11).

---

### Component 6: `server/src/middleware/authMiddleware.js` → `protect()` & `enforceUserScope()`
- **Role:** Verifies HttpOnly JWT cookie or Bearer token, extracts user identity, attaches `req.user`, and guarantees all downstream controllers execute within authenticated user boundaries.
- **Directly affected:**
  - All routes in `server/src/routes/accountRoutes.js`
  - All routes in `server/src/routes/transactionRoutes.js`
  - All routes in `server/src/routes/budgetRoutes.js`
  - All routes in `server/src/routes/goalRoutes.js`
  - All routes in `server/src/routes/reportRoutes.js`
  - All routes in `server/src/routes/importRoutes.js`
- **Potentially affected:**
  - `client/src/services/apiClient.js` (interceptors handling 401 token refresh or redirect to login).
  - `client/src/components/auth/ProtectedRoute.jsx`.
- **API impact:** Intercepts all `/api/v1/*` routes (except `/auth/register` and `/auth/login`). Returns `401 Unauthorized` on missing or expired tokens.
- **Data impact:** Attaches `req.user = { id, email, currency }` to request lifecycle.
- **Security impact:** Foundation of multi-tenant isolation. A bug here completely breaks access control and exposes financial records.
- **Runtime impact:** Lightweight JWT verification on every HTTP request.
- **Frontend impact:** Redirects unauthenticated users to `/login`.
- **Tests to review:** `server/tests/authMiddleware.test.js`, `server/tests/jwtLifecycle.test.js`.
- **Infrastructure impact:** Requires `JWT_SECRET` configured in environment variables.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 11: Enterprise Security Hardening).

---

### Component 7: `server/src/validators/transactionValidator.js` → Zod Transaction & Transfer Schemas
- **Role:** Enforces positive 64-bit integer paise amounts (`z.number().int().positive()`), validates ISO dates, category IDs, account IDs, and strips unauthorized parameters.
- **Directly affected:**
  - `server/src/routes/transactionRoutes.js`
  - `server/src/controllers/transactionController.js`
- **Potentially affected:**
  - Client transaction forms (`AddTransactionModal.jsx`, `TransferModal.jsx`).
  - Mobile API clients.
- **API impact:** Returns `400 Bad Request` with structured `{ error: 'Validation Error', issues: [...] }` if client submits decimals, negative numbers, or invalid enum values.
- **Data impact:** Guarantees no floating-point or malformed records ever reach Mongoose models.
- **Security impact:** Blocks NoSQL query injection payloads (`$gt`, `$regex`) and payload bloat attacks.
- **Runtime impact:** Nanosecond Zod schema parsing.
- **Frontend impact:** Field-level validation error display on form inputs.
- **Tests to review:** `server/tests/transactionValidator.test.js`, `server/tests/integerValidation.test.js`.
- **Infrastructure impact:** None.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 3; Chapter 11).

---

### Component 8: `server/src/services/reports/exportService.js` → `generateExcelWorkbook()` & `generatePdfReport()`
- **Role:** Compiles multi-sheet styled Excel workbooks (Overview, Transactions, Accounts, Budgets) and PDF summary reports, streaming them directly to HTTP clients.
- **Directly affected:**
  - `server/src/controllers/reportsController.js` (`exportTransactionsExcel`, `exportTransactionsPdf`)
  - `server/src/routes/reportRoutes.js`
- **Potentially affected:**
  - `client/src/features/reports/ExportModal.jsx`.
- **API impact:** `GET /api/v1/exports/transactions?format=excel|pdf&startDate=...&endDate=...`. Returns binary file stream with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- **Data impact:** Read-only aggregation across `Transaction`, `Account`, and `Budget` collections.
- **Security impact:** Neutralizes formula injection strings in exported cells; strictly scopes data to `req.user.id`.
- **Runtime impact:** Uses streaming workbooks (`ExcelJS.stream.xlsx.WorkbookWriter`) to maintain low memory usage during large exports.
- **Frontend impact:** Triggers browser download dialog.
- **Tests to review:** `server/tests/exportService.test.js`.
- **Infrastructure impact:** Temporary CPU spike during PDF rendering; mitigated by streaming.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 9; Chapter 10).

---

### Component 9: `server/src/services/goals/goalService.js` → `recordContribution()` & `computeGoalProgress()`
- **Role:** Manages savings milestone tracking, creates contribution ledger entries, computes percentage completion, and generates celebration notifications upon goal achievement.
- **Directly affected:**
  - `server/src/controllers/goalController.js`
  - `server/src/models/SavingsGoal.js`
  - `server/src/models/GoalContribution.js`
- **Potentially affected:**
  - `client/src/features/goals/GoalCard.jsx` (radial progress indicator).
  - `client/src/features/goals/AddContributionModal.jsx`.
- **API impact:** `GET /api/v1/goals`, `POST /api/v1/goals`, `POST /api/v1/goals/:id/contributions`.
- **Data impact:** Updates `currentAmountMinor` on `SavingsGoal` and appends `GoalContribution` record.
- **Security impact:** Enforces `userId` validation on both goal and contribution.
- **Runtime impact:** Lightweight atomic `$inc` updates.
- **Frontend impact:** Dynamically updates savings milestone completion curves.
- **Tests to review:** `server/tests/goalService.test.js`.
- **Infrastructure impact:** None.
- **Confidence:** Verified.
- **Evidence:** `SmartSpend_Comprehensive_Documentation.md` (Chapter 8; Chapter 10).

---

## 3. Critical Change Paths

| Component Path | Affected Areas | Reason | System Risk |
| :--- | :--- | :--- | :---: |
| `server/src/services/finance/calculationEngine.js` | All accounts, dashboard analytics, cash flow charts, Excel export | Foundational financial math engine. Modifying formulas affects all displayed figures and balance derivations. | **CRITICAL** |
| `server/src/middleware/authMiddleware.js` | All API endpoints, controllers, user scoping | Core security perimeter. Any bypass or regression results in immediate cross-tenant data exposure (BOLA). | **CRITICAL** |
| `server/src/validators/transactionValidator.js` | Transaction ingress, CSV confirmation, transfer routing | Gatekeeper for integer paise enforcement. Relaxing validation admits floating-point numbers into DB. | **CRITICAL** |
| `server/src/services/finance/transferService.js` | `Transaction` collection, `Account` balances, cash flow aggregates | Dual-entry atomic transfers. Incomplete writes cause balance mismatch; missing filters distort P&L. | **HIGH** |
| `server/src/imports/csvParser.js` | CSV upload, transaction ingestion, user workstation security | Entry point for external files. Inadequate sanitization enables spreadsheet macro code execution. | **HIGH** |
| `server/src/jobs/recurringCron.js` | `RecurringRule` table, scheduled transaction synthesizer | Background daemon. Race conditions or improper date math generate runaway duplicate billing records. | **HIGH** |

---

## 4. Change-Impact Checklist

Before modifying any mapped component, verify:
- [ ] **Direct Consumers Checked:** Method signatures and return structures verified across all callers.
- [ ] **Indirect Consumers Checked:** Event listeners, background jobs, and side effects accounted for.
- [ ] **Integer Paise Standard Maintained:** No IEEE 754 floats introduced in schemas, validators, or math.
- [ ] **Transfer Neutrality Maintained:** Transfers excluded from income/expense queries (`type: { $in: ['income', 'expense'] }`).
- [ ] **Tenant Scoping Enforced:** All queries explicitly include `userId: req.user.id`.
- [ ] **Dual-Account Ownership Verified:** Inter-account transfers verify both accounts belong to the caller.
- [ ] **CSV Formula Neutralized:** Leading `=`, `+`, `-`, `@` characters properly sanitized.
- [ ] **Idempotent Alerts Preserved:** Budget alert arrays prevent notification spam.
- [ ] **Automated Tests Executed:** Vitest and Supertest suites pass with exit code 0.
- [ ] **API Contracts Preserved:** REST `/api/v1` response schemas match client TanStack Query expectations.

---

## 5. Unknown / Inferred Dependencies

1. **Third-Party Bank Statement Header Formats:**  
   - *Status:* Inferred — Not Confirmed.  
   - *Detail:* Different commercial banks (HDFC, SBI, ICICI, Axis) use varying header names (`Txn Date`, `Value Date`, `Debit`, `Credit`, `Withdrawal`, `Deposit`). The CSV parser supports standard column aliases, but custom banking formats require dynamic column mapping in `CsvUploadModal.jsx`.
2. **Multi-Currency Conversion Engine:**  
   - *Status:* Out of Scope for v1.0.0.  
   - *Detail:* System is optimized for Indian Rupee (`INR`) minor units (paise). Cross-currency conversion with live forex rates is planned for a subsequent version and is not currently coupled to the core ledger.
