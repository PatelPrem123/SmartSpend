# Attack Surface Mapping (attack-surface.md)

**System:** SmartSpend (FinTech & Multi-Account Personal Wealth Management Platform)  
**Maintained For:** Security Reviewers, Penetration Testers, QA Engineers  
**Document Version:** 1.0.0  

---

## 1. External & Public Endpoints (Unauthenticated)

| HTTP Method | Route Path | Purpose | Consumed Payload | Rate Limit | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | User Registration & Category Seed | `{ email, password, name, currency }` | 5 req / 15 min | Medium (Spam accounts, credential stuffing) |
| `POST` | `/api/v1/auth/login` | User Authentication | `{ email, password }` | 5 req / 15 min | High (Brute-force credential attacks) |
| `GET` | `/health` | Gateway Liveness Probe | None | 60 req / min | Low (Fingerprinting) |

---

## 2. Authenticated Endpoints (Protected by JWT)

| Resource | Methods | Route Pattern | Input Surfaces | Primary Security Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Accounts** | `GET`, `POST` | `/api/v1/accounts` | Query params (type, archived), Body (`name, type, openingBalanceMinor, color`) | BOLA / IDOR, Negative balance tampering |
| **Accounts** | `GET`, `PATCH` | `/api/v1/accounts/:id` | Route param (`:id`), Body (`name, color, isArchived`) | BOLA / IDOR cross-tenant modification |
| **Transactions** | `GET`, `POST` | `/api/v1/transactions` | Query params (page, limit, accountId, categoryId, type, startDate, endDate), Body (`type, amountMinor, accountId, categoryId, transactionDate, description`) | BOLA, Float precision bypass, NoSQL injection |
| **Transfers** | `POST` | `/api/v1/transactions/transfer` | Body (`fromAccountId, toAccountId, amountMinor, description, transactionDate`) | Dual-account cross-tenant ownership bypass |
| **Transactions** | `PATCH`, `DELETE`| `/api/v1/transactions/:id` | Route param (`:id`), Body (`amountMinor, description, categoryId`) | BOLA deletion/tampering, balance drift |
| **Budgets** | `GET`, `POST`, `PATCH`| `/api/v1/budgets` | Body (`categoryId, amountMinor, period, yearMonth`) | Negative budgets, duplicate budget creation |
| **Recurring Rules** | `GET`, `POST`, `DELETE`| `/api/v1/recurring` | Body (`type, amountMinor, accountId, frequency, startDate, nextRunAt`) | Runaway schedule injection |
| **Savings Goals** | `GET`, `POST` | `/api/v1/goals` | Body (`name, targetAmountMinor, targetDate, color`) | Input validation |
| **Contributions**| `POST` | `/api/v1/goals/:id/contributions`| Route param (`:id`), Body (`amountMinor, accountId, date, note`) | Negative contribution, BOLA on goal |
| **Analytics** | `GET` | `/api/v1/dashboard/summary` | Query param (`month, year`) | DoS on heavy aggregation pipeline |
| **Reports** | `GET` | `/api/v1/reports/cashflow` | Query param (`months`) | Aggregation query resource consumption |
| **CSV Ingestion** | `POST` | `/api/v1/imports/csv/preview` | Multipart file upload (`file: *.csv`, `accountId`) | CSV formula injection, memory exhaustion |
| **CSV Confirm** | `POST` | `/api/v1/imports/csv/confirm` | Body (`importBatchId, selectedRowIndexes`) | Batch injection, duplicate insertion |
| **Exports** | `GET` | `/api/v1/exports/transactions` | Query param (`format=excel\|pdf`, `startDate`, `endDate`) | CSV formula injection in exported files |

---

## 3. Authentication & Authorization Surfaces

1. **HttpOnly Cookie Ingress:**
   - Client sends JWT inside `jwt` HttpOnly cookie.
   - Attack vector: Cross-Site Request Forgery (CSRF).
   - Mitigated by: `SameSite=Lax` cookie attribute, combined with CORS origin verification and standard REST architecture.
2. **User Isolation (BOLA Defense):**
   - Every controller extracts `req.user.id` and prepends it to all MongoDB queries (`{ userId: req.user.id }`).
   - Attack vector: Attacker manipulates `:id` in URL to access other users' transactions or accounts.
   - Mitigated by: Mongoose compound queries enforcing user ownership.

---

## 4. User Input & Validation Surfaces

| Input Surface | Parameter | Type Expected | Threat / Malicious Input | Hardened Defense |
| :--- | :--- | :--- | :--- | :--- |
| **Currency Amounts** | `amountMinor`, `openingBalanceMinor` | Positive Integer | `1250.50`, `-500`, `'1e6'`, `NaN` | Zod: `z.number().int().positive()` |
| **Descriptions & Notes** | `description`, `note`, `name` | Sanitized String | `<script>alert(1)</script>`, `onload=...` | DOMPurify string sanitization |
| **Account & Category IDs** | `accountId`, `categoryId` | MongoDB ObjectId | `{"$ne": null}` (NoSQL injection) | Zod regex checking 24-char hex string |
| **Frequency Enum** | `frequency` | String enum | Arbitrary strings, prototype pollution | Zod: `z.enum(['daily', 'weekly', 'monthly', 'yearly'])` |
| **Dates** | `transactionDate`, `startDate` | ISO 8601 String | Malformed strings, invalid timestamps | Zod: `z.string().datetime()` |

---

## 5. File Upload & Ingestion Surfaces

- **Endpoint:** `POST /api/v1/imports/csv/preview`
- **Component:** Multer middleware + Papa Parse stream.
- **Constraints Enforced:**
  1. `limits: { fileSize: 5 * 1024 * 1024 }` (Maximum 5 MB).
  2. MIME type check: `text/csv`, `application/vnd.ms-excel`, `text/plain`.
  3. Memory storage or ephemeral `/tmp` storage; file buffer unlinked after parsing.
  4. Formula Injection Defense: Every text cell checked; if starting with `=`, `+`, `-`, or `@`, an apostrophe (`'`) is prepended before saving or previewing.

---

## 6. Database & Persistence Access Surfaces

- **Database Engine:** MongoDB 7.x
- **ORM / ODM:** Mongoose ODM
- **Injection Risks:**
  - Query operator injection (`$gt`, `$where`, `$ne`) via JSON request bodies.
  - Defense: Mongoose schema strictly casts fields; unknown top-level query operators are rejected by Zod validators.
- **Index Surfaces:**
  - Compound indexes (`{ userId: 1, transactionDate: -1 }`, `{ userId: 1, accountId: 1 }`) guarantee high-speed index scans and prevent unindexed full-collection sweeps.

---

## 7. Background Jobs & Internal Surfaces

- **Daemon:** `node-cron`
- **Schedule:** `00:01:00 UTC` daily.
- **Surface:** Internal worker process.
- **Risks:** Unhandled promise rejections inside the cron loop causing node crash; race conditions generating duplicate billing records.
- **Defense:** Try-catch block wraps the daily runner; idempotency lookup checks for existing transaction records for that rule and date before insertion.

---

## 8. Third-Party & Network Exposure

- **External Banking APIs:** None. SmartSpend intentionally operates on user-uploaded CSV statements, completely eliminating Open Banking API token risks and bank account takeover liabilities.
- **External Integrations:** Zero outbound third-party webhooks in v1.0.0.
- **Network Boundaries:** Reverse proxy (Nginx / Cloudflare) terminates TLS 1.3, provides DDoS mitigation, and forwards traffic to the Node.js Express process.
