# Threat Model Analysis (threat-model.md)

**System:** SmartSpend (FinTech & Multi-Account Personal Wealth Management Platform)  
**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**Scope:** Client SPA (React 18), REST API Gateway & Reporting Engine (Node.js / Express), node-cron Scheduling Daemon, Ingestion Pipeline (Papa Parse), Persistence Tier (MongoDB 7.x).

---

## 1. System Assets

| Asset ID | Asset Name | Description & Classification |
| :--- | :--- | :--- |
| **AST-01** | **User Credentials & Auth Tokens** | Bcrypt password hashes, active JWT tokens stored in HttpOnly secure cookies. *(Confidential / High)* |
| **AST-02** | **Multi-Account Financial Ledger** | Bank accounts, wallet balances, cash reserves, credit card liabilities, opening balances in paise. *(Confidential / Critical)* |
| **AST-03** | **Transaction Records & Notes** | Incomes, expenses, dual-entry transfers, merchant descriptions, uploaded receipts. *(Confidential / Critical)* |
| **AST-04** | **Bank Statement Ingestion Files** | User-uploaded CSV files containing transaction history, account numbers, and sensitive text. *(Confidential / High)* |
| **AST-05** | **Recurring Rules & Schedules** | Active subscription schedules, payment amounts, and execution dates. *(Confidential / Medium)* |
| **AST-06** | **Savings Goals & Progress** | Personal savings targets, milestones, and accumulated contribution amounts. *(Confidential / Medium)* |
| **AST-07** | **Audit Trail & Import Logs** | Append-only `AuditLog` records and `ImportBatch` metadata for forensic analysis. *(Integrity Critical)* |

---

## 2. Trust Boundaries

```
[ Public Internet / Untrusted Client Browser ]
                     │  (HTTPS / TLS 1.3)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Trust Boundary 1: API Gateway & Security Ingress             │
│ - Helmet Security Headers (HSTS, CSP, X-Frame-Options)       │
│ - Express Rate Limiting (Brute-Force & API Abuse Defense)    │
│ - CORS Origin Validation (Whitelisted SPA Domains Only)      │
└─────────────────────────────────────────────────────────────┘
                     │  (HttpOnly SameSite JWT Cookie)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Trust Boundary 2: Application Layer & User Scoping           │
│ - JWT Authentication Middleware (`req.user`)                │
│ - Strict Tenant Boundary Enforcement (`userId: req.user.id`) │
│ - Zod Schema Validation (Integer Minor Units Enforcement)    │
│ - DOMPurify Text Sanitization (XSS Neutralization)           │
│ - Papa Parse CSV Macro Injection Pre-Filter (`'`, `=`, etc.) │
└─────────────────────────────────────────────────────────────┘
                     │  (Encrypted Internal Mongoose Connection)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Trust Boundary 3: Data Persistence Tier (MongoDB 7.x)       │
│ - Compound Indexing (`{ userId: 1, ... }`)                   │
│ - Schema Type Casting (Integers, ObjectIds, ISO Dates)       │
│ - Immutable Append-Only Ledger (`AuditLog`)                  │
└─────────────────────────────────────────────────────────────┘
                     ▲
                     │  (System Internal Context)
┌─────────────────────────────────────────────────────────────┐
│ Trust Boundary 4: Background node-cron Scheduling Daemon    │
│ - Runs isolated daily cron jobs at 00:01:00 UTC             │
│ - Synthesizes recurring transactions in user context         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Threat Actors

| Actor ID | Actor Class | Motivation & Capability |
| :--- | :--- | :--- |
| **ACT-01** | **External Anonymous Attacker** | Opportunistic attacker targeting exposed endpoints, credential stuffing, brute-force logins, and DoS. |
| **ACT-02** | **Malicious Authenticated User** | Legitimate user attempting BOLA/IDOR attacks to access, tamper with, or delete other users' accounts or transactions. |
| **ACT-03** | **Social Engineering / Phishing Attacker** | Attacker crafting malicious CSV bank statements containing spreadsheet formula injection payloads (`=cmd|' /C calc'!A0`). |
| **ACT-04** | **Insider / Rogue Administrator** | Privileged actor attempting to view user financial data or alter audit logs. |

---

## 4. Threats & Attack Scenarios (STRIDE Analysis)

### 4.1 Spoofing (Identity Spoofing)
- **Threat:** Attacker intercepts or forges JWT tokens to impersonate legitimate account holders.
- **Scenario:** Attacker sniffs unencrypted HTTP traffic or steals tokens from client `localStorage`.
- **Impact:** Critical (Full account takeover, financial visibility).
- **Likelihood:** Low (Mitigated by HTTPS and HttpOnly, SameSite=Lax cookies).
- **Existing Mitigations:** JWTs signed with `HS256` using high-entropy secret; tokens stored in HttpOnly cookies with `secure: true` in production.
- **Missing Mitigations:** In-memory token revocation blacklist for immediate session invalidation on password reset.

### 4.2 Tampering (Data Modification)
- **Threat 1: Floating-Point Rounding Corruption**
  - **Scenario:** Attacker submits crafted decimal amounts (`1250.9999`) causing database rounding errors.
  - **Impact:** High (Audit failure, balance discrepancies).
  - **Likelihood:** Low (Mitigated by integer paise standard and Zod).
  - **Existing Mitigations:** Zod validates `amountMinor` as integer only (`z.number().int().positive()`).
- **Threat 2: CSV Formula Macro Injection (Spreadsheet Command Execution)**
  - **Scenario:** Attacker uploads a CSV statement with a description `=cmd|'/C powershell ...'!A0`. When another user or accountant exports to Excel, the macro executes.
  - **Impact:** Critical (Remote code execution on victim's machine).
  - **Likelihood:** Medium.
  - **Existing Mitigations:** Pre-parser sanitizes any cell beginning with `=`, `+`, `-`, or `@` by prepending an apostrophe (`'`).

### 4.3 Repudiation (Disputing Financial Actions)
- **Threat:** User claims an inter-account transfer or transaction deletion was unauthorized.
- **Scenario:** Unauthorized party with physical access to an unlocked device deletes financial records.
- **Impact:** Medium (Dispute resolution overhead, user frustration).
- **Likelihood:** Medium.
- **Existing Mitigations:** `AuditLog` collection records sensitive deletions, modifications, and login IPs with immutable timestamps.

### 4.4 Information Disclosure (Data Leakage)
- **Threat 1: Broken Object Level Authorization (BOLA / IDOR)**
  - **Scenario:** Authenticated user submits `GET /api/v1/accounts/64f1a2...` pointing to an account belonging to a different user.
  - **Impact:** Critical (Confidential financial balance and account exposure).
  - **Likelihood:** High if queries omit user scope.
  - **Existing Mitigations:** All queries enforce `{ _id: req.params.id, userId: req.user.id }`.
- **Threat 2: Stack Trace & Error Message Disclosure**
  - **Scenario:** Server catches unhandled database exception and outputs raw MongoDB connection strings or query internals to client.
  - **Impact:** Medium.
  - **Existing Mitigations:** Centralized error handler suppresses internal stack traces in production (`NODE_ENV === 'production'`).

### 4.5 Denial of Service (DoS)
- **Threat 1: File Upload Exhaustion**
  - **Scenario:** Attacker uploads multi-gigabyte files to `/api/v1/imports/csv/preview` to exhaust server memory and disk.
  - **Impact:** High (Server crash, OOM outage).
  - **Existing Mitigations:** Multer configured with `limits: { fileSize: 5 * 1024 * 1024 }` (5MB cap) and strictly checks `.csv` file extension.
- **Threat 2: Ingestion & Export CPU Exhaustion**
  - **Scenario:** Attacker requests massive Excel exports in rapid succession.
  - **Impact:** Medium.
  - **Existing Mitigations:** Rate limiting on export endpoints; ExcelJS streaming architecture.

### 4.6 Elevation of Privilege
- **Threat:** Regular user executes administrative or cron triggers.
- **Scenario:** User calls internal trigger endpoint `/api/v1/recurring/trigger-due`.
- **Impact:** High (Artificial transaction synthesis).
- **Existing Mitigations:** Recurring cron runs as an internal daemon on the server loop, not exposed as an unauthenticated route.

---

## 5. Security Summary & Risk Assessment Matrix

| Threat ID | Threat Description | STRIDE Category | Impact | Likelihood | Risk Severity | Mitigated? |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **THR-01** | BOLA / IDOR cross-tenant record tampering | Elevation of Privilege | Critical | High | **CRITICAL** | Yes (`userId` scoping) |
| **THR-02** | Floating-point rounding discrepancies | Tampering | High | Medium | **HIGH** | Yes (Integer paise) |
| **THR-03** | CSV Spreadsheet Formula Injection | Tampering / Info Disclosure | Critical | Medium | **HIGH** | Yes (Apostrophe escaping) |
| **THR-04** | JWT Session Hijacking via XSS | Spoofing | Critical | Low | **HIGH** | Yes (HttpOnly cookies + DOMPurify) |
| **THR-05** | Credential Stuffing & Brute Force | Spoofing | High | Medium | **MEDIUM** | Yes (express-rate-limit) |
| **THR-06** | Runaway Recurring Cron Execution | Denial of Service | Medium | Low | **LOW** | Yes (Idempotency checks) |
