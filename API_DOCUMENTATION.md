# SmartSpend — REST API v1 Specification (API_DOCUMENTATION.md)

**API Gateway:** Node.js + Express  
**Base URL:** `/api/v1`  
**Authentication Scheme:** Bearer JWT in `Authorization` header (`Authorization: Bearer <token>`) or HttpOnly cookie (`smartspend_jwt`).

---

## 1. Global Architectural Standards

1. **Integer Minor Currency Standard (DEC-002):** All amounts in request bodies and responses are expressed strictly as 64-bit integer paise for INR ($₹1.00 = 100\text{ paise}$).
2. **Tenant Isolation (DEC-007):** Every authenticated endpoint automatically derives `userId` from the verified JWT. Any request payload supplying a `userId` is strictly ignored.
3. **Dual-Entry Transfer Neutrality (DEC-003):** Inter-account transfers shift balances between accounts without distorting monthly Income or Expense statistics.

---

## 2. Standard Response & Error Format

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Amount must be an integer paise value"
  }
}
```

---

## 3. API Endpoints Catalog

### A. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register new user, hash password, seed categories | No |
| `POST` | `/api/v1/auth/login` | Authenticate with email/password, return JWT | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes |
| `POST` | `/api/v1/auth/logout` | Invalidate cookie session | Yes |
| `PATCH` | `/api/v1/auth/update-password`| Rotate password and increment `tokenVersion` | Yes |

---

### B. Account Management (`/api/v1/accounts`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/accounts` | List accounts (supports `?includeArchived=true`) | Yes |
| `POST` | `/api/v1/accounts` | Create financial account with integer paise opening balance | Yes |
| `GET` | `/api/v1/accounts/:id` | Retrieve single account details | Yes |
| `PATCH` | `/api/v1/accounts/:id` | Update account metadata (name, color, icon) | Yes |
| `DELETE` | `/api/v1/accounts/:id` | Soft-archive account (`isArchived: true`) | Yes |

---

### C. Categories (`/api/v1/categories`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/categories` | List user custom categories and system defaults | Yes |
| `POST` | `/api/v1/categories` | Create custom category (`income` or `expense`) | Yes |
| `PATCH` | `/api/v1/categories/:id`| Update custom category details | Yes |
| `DELETE` | `/api/v1/categories/:id`| Delete custom category (prevents default deletion) | Yes |

---

### D. Transactions & Dual-Entry Transfers (`/api/v1/transactions`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/transactions` | Paginated transactions (`?page=1&limit=20&type=...`) | Yes |
| `POST` | `/api/v1/transactions` | Create income or expense and mutate account balance | Yes |
| `POST` | `/api/v1/transactions/transfer` | Dual-entry inter-account transfer (DEC-003) | Yes |
| `GET` | `/api/v1/transactions/:id` | Retrieve single transaction record | Yes |
| `PATCH` | `/api/v1/transactions/:id` | Update amount/category and adjust account balance delta | Yes |
| `DELETE` | `/api/v1/transactions/:id` | Delete transaction and restore account balance | Yes |

---

### E. Dashboard Analytics (`/api/v1/dashboard`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/dashboard/summary` | Consolidated liquidity, income, expense, net cash flow, savings rate | Yes |

---

### F. Budgets & Idempotent Alerts (`/api/v1/budgets`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/budgets` | List evaluated budgets (`?monthYear=YYYY-MM`) | Yes |
| `POST` | `/api/v1/budgets` | Create category or overall monthly budget | Yes |
| `GET` | `/api/v1/budgets/:id` | Get budget details with current spending progress | Yes |
| `PATCH` | `/api/v1/budgets/:id` | Update budget amount cap and re-evaluate tiers | Yes |
| `DELETE` | `/api/v1/budgets/:id` | Remove budget cap | Yes |

---

### G. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/notifications` | List notifications and unread alert count | Yes |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark single alert as read | Yes |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all alerts as read | Yes |

---

### H. Recurring Scheduled Transactions (`/api/v1/recurring`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/recurring` | List recurring bill and salary rules | Yes |
| `POST` | `/api/v1/recurring` | Create rule with edge-of-month calendar forward math | Yes |
| `GET` | `/api/v1/recurring/:id` | Get recurring rule details | Yes |
| `PATCH` | `/api/v1/recurring/:id` | Update rule, pause/resume (`isActive`), or amount | Yes |
| `DELETE` | `/api/v1/recurring/:id` | Delete recurring rule | Yes |
| `POST` | `/api/v1/recurring/sweep` | Manual trigger for node-cron daemon evaluation | Yes |
| `GET` | `/api/v1/recurring/:id/transactions` | View transactions generated by this rule | Yes |

---

### I. CSV Bank Statement Ingestion & Export (`/api/v1/imports`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/imports/csv/preview` | Upload statement, sanitize formula macros, detect duplicates | Yes |
| `POST` | `/api/v1/imports/csv/confirm` | Commit approved rows to ledger and log `ImportBatch` | Yes |
| `GET` | `/api/v1/imports` | List previous import batches and audit statistics | Yes |
| `GET` | `/api/v1/imports/csv/export` | Download sanitized CSV transaction ledger | Yes |

---

### J. Savings Goals & Contributions (`/api/v1/goals`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/goals` | List savings goals (`?status=active\|completed`) | Yes |
| `POST` | `/api/v1/goals` | Create savings goal with target date and integer cap | Yes |
| `GET` | `/api/v1/goals/:id` | Get goal details and contribution history | Yes |
| `PATCH` | `/api/v1/goals/:id` | Update target amount, date, or status | Yes |
| `DELETE` | `/api/v1/goals/:id` | Delete goal and remove associated contributions | Yes |
| `GET` | `/api/v1/goals/:id/contributions` | List contributions for a goal | Yes |
| `POST` | `/api/v1/goals/:id/contributions` | Record contribution, debit account, evaluate milestones | Yes |
| `DELETE` | `/api/v1/goals/:id/contributions/:cid` | Reverse contribution and restore account balance | Yes |

---

### K. Financial Reports & Document Export (`/api/v1/reports`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/reports/cashflow` | Monthly cash flow series (`?months=6`) | Yes |
| `GET` | `/api/v1/reports/categories` | Spending breakdown by category (`?type=expense`) | Yes |
| `GET` | `/api/v1/reports/accounts/:id/derived-balance` | Mathematically derived balance verification | Yes |
| `GET` | `/api/v1/reports/annual-summary` | 12-month calendar breakdown & annual totals (`?year=2026`) | Yes |
| `GET` | `/api/v1/reports/export/excel` | Stream multi-sheet formatted `.xlsx` workbook (DEC-011) | Yes |
| `GET` | `/api/v1/reports/export/pdf` | Stream formal printable `.pdf` financial statement (DEC-011) | Yes |

---

### L. Health & Diagnostics (`/api/v1/health`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/v1/health` | Service uptime, memory usage, and API status | No |
