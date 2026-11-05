# 💰 SmartSpend — FinTech & Personal Wealth Platform

> **Multi-Account Financial Ledger, Integer Currency Precision, Budget Alerts & Analytics System**  
> *Version: 1.0.0 (Production Architecture) | Monorepo: React 18, Vite, Node.js, Express, MongoDB 7.x, Recharts, node-cron, Papa Parse, ExcelJS*

---

## 📌 Executive Summary

**SmartSpend** is an enterprise-grade personal wealth and expense management system engineered to provide absolute mathematical precision, multi-account ledger consistency, and actionable financial intelligence.

Unlike superficial budget apps that suffer from floating-point rounding errors and distort monthly reports with internal transfers, SmartSpend:
1. **Stores currency exclusively in 64-bit integer minor units (paise for INR)**: ₹1,250.50 = `125050` paise, permanently eliminating IEEE 754 rounding artifacts.
2. **Maintains strict transfer neutrality**: Moving funds between accounts (Savings → UPI Wallet) shifts liquidity without distorting income or expense aggregates.
3. **Implements idempotent budget threshold alerts**: Array-tracked notifications (`['50', '75', '90', '100']`) prevent alert spamming.
4. **Automates recurring subscriptions**: A daily `node-cron` daemon (`00:01:00 UTC`) synthesizes due bills without duplicates.
5. **Hardens bank statement CSV ingestion**: Papa Parse streams files, sanitizes formula macro injection (`=`, `+`, `-`, `@`), and generates MD5 deduplication fingerprints.
6. **Enforces tenant isolation**: Every database query is scoped to `userId: req.user.id`, defending against Broken Object Level Authorization (BOLA).

---

## 🏛️ System Architecture Topology

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT PRESENTATION TIER                                 │
│      React 18 + Vite SPA  •  Tailwind CSS  •  TanStack Query  •  Recharts         │
│  [Finance Overview]       [Transaction Filters]        [Budget Limits & Goals]    │
└────────────────────────┬──────────────────────────────────┬───────────────────────┘
                         │ HTTPS REST Requests (/api/v1)   │
                         ▼                                  ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION, GATEWAY & RECURRING TIER                         │
│  Express.js API Gateway  •  Helmet / Rate Limiting  •  JWT Auth  •  Zod Guards   │
│  ├── Financial Calculation Engine (Paise integer math, balance derivation)        │
│  ├── Budget & Threshold Alert Service (Non-duplicate alert ledger)                │
│  ├── Background Cron Scheduler (node-cron daily recurring processor)             │
│  ├── CSV Ingestion Pipeline (Papa Parse, formula injection sanitizer)             │
│  └── Reporting & Export Subsystem (ExcelJS workbooks, PDFKit summaries)          │
└────────────────────────┬──────────────────────────────────────────────────────────┘
                         │ Mongoose ODM Operations (Atomic Operations & Compound Indexes)
                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           DATA PERSISTENCE TIER                                   │
│  MongoDB 7.x Database Cluster (User-Scoped Isolation)                            │
│  ├── Users (Auth & Preferences)      ├── Accounts (Wallets, Bank, Credit)         │
│  ├── Transactions (amountMinor)      ├── Categories (Taxonomy)                    │
│  ├── Budgets (Monthly Caps)          ├── RecurringRules (Schedules)               │
│  ├── SavingsGoals & Contributions    ├── ImportBatches (CSV Audit)                │
│  └── Notifications (Alerts)          └── AuditLogs (Ledger History)               │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Architectural & Security Decisions

| Decision ID | Principle | Architectural Guarantee |
| :--- | :--- | :--- |
| **`DEC-001`** | **Decoupled 3-Tier SaaS** | React 18 SPA + Express.js API v1 + MongoDB 7.x. |
| **`DEC-002`** | **Integer Minor Currency** | All transactions, balances, and budgets stored in integer paise ($₹1 = 100\text{ paise}$). |
| **`DEC-003`** | **Transfer Neutrality** | Inter-account transfers update account balances symmetrically with zero net cash flow distortion. |
| **`DEC-004`** | **Idempotent Budget Alerts** | Thresholds tracked in `alertThresholdsFired` array to prevent duplicate alerts. |
| **`DEC-005`** | **node-cron Daemon** | Daily recurring transaction generation with forward calendar math. |
| **`DEC-006`** | **CSV Sanitization & MD5 Dedup** | Neutralizes formula macros (`=`, `+`, `-`, `@`) and computes row fingerprints. |
| **`DEC-007`** | **Strict Tenant Scoping** | All queries strictly scoped by `userId: req.user.id` to prevent BOLA/IDOR. |
| **`DEC-008`** | **Multi-Account Model** | Cash, Bank, Digital Wallets, Credit Cards, and Emergency Funds. |
| **`DEC-009`** | **Dual Validation** | Zod integer schema guards + DOMPurify text sanitization. |
| **`DEC-010`** | **Mathematical Financial Engine** | Centralized balance rollups, cash flows, and zero-income guarded savings rate. |
| **`DEC-011`** | **Streaming ExcelJS & PDFKit** | Multi-sheet styled workbooks and printable financial summaries. |
| **`DEC-012`** | **Forensic Audit Trails** | Append-only `AuditLog` and batch-tracked `ImportBatch`. |
| **`DEC-013`** | **Vitest Automated Testing** | Automated financial correctness, transfer neutrality, and BOLA test suites. |

---

## 📂 Project Governance & Security Files

| File | Path | Purpose |
| :--- | :--- | :--- |
| **`INSTALLATION.md`** | [`INSTALLATION.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/INSTALLATION.md) | Step-by-step setup, environment variables, and verification. |
| **`ARCHITECTURE.md`** | [`ARCHITECTURE.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/ARCHITECTURE.md) | Decoupled 3-Tier architecture, Mermaid workflows, and directory layout. |
| **`DATABASE_SCHEMA.md`** | [`DATABASE_SCHEMA.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/DATABASE_SCHEMA.md) | Complete ER diagram, 11 Mongoose models, indexes, and constraints. |
| **`API_DOCUMENTATION.md`** | [`API_DOCUMENTATION.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/API_DOCUMENTATION.md) | Complete REST API v1 catalog, contracts, error payloads, and formats. |
| **`FINANCIAL_LOGIC.md`** | [`FINANCIAL_LOGIC.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/FINANCIAL_LOGIC.md) | Mathematical ledger proofs, integer paise standard, zero-income guards. |
| **`RECURRING_JOBS.md`** | [`RECURRING_JOBS.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/RECURRING_JOBS.md) | node-cron daily daemon, calendar forward clamping math, idempotency. |
| **`TESTING.md`** | [`TESTING.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/TESTING.md) | QA test report covering 112 passed tests across 12 test suites. |
| **`DEPLOYMENT.md`** | [`DEPLOYMENT.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/DEPLOYMENT.md) | Production Docker, Nginx reverse proxy, PM2, and backup scripts. |
| **`DECISIONS.md`** | [`DECISIONS.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/DECISIONS.md) | Authoritative record of architectural decisions (DEC-001 to DEC-013). |
| **`IMPACT-MAP.md`** | [`IMPACT-MAP.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/IMPACT-MAP.md) | Dependency map and blast radius for every core service and model. |
| **`AGENTS.md`** | [`AGENTS.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/AGENTS.md) | Master AI testing & senior engineering quality contract. |
| **`GEMINI.md`** | [`GEMINI.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/GEMINI.md) | Synchronization of AI engineering quality rules. |
| **Threat Model** | [`security/threat-model.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/security/threat-model.md) | STRIDE threat modeling analysis for SmartSpend. |
| **Secrets Guide** | [`security/secrets.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/security/secrets.md) | Secrets lifecycle, zero-hardcode enforcement, and rotation guide. |
| **Attack Surface** | [`security/attack-surface.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/security/attack-surface.md) | Complete map of endpoints, inputs, uploads, and boundaries. |
| **Security Checklist** | [`security/security-checklist.md`](file:///e:/vs%20code/All%20Main%20Main%20Projects/SmartSpend/security/security-checklist.md) | 20-point production security verification checklist and audit findings. |

---

## 🛠️ Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: v18.x or v20.x LTS
- **MongoDB**: v7.x running locally or MongoDB Atlas cluster connection URI

### 2. Environment Setup
Configure `server/.env`:
```bash
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/smartspend
JWT_SECRET=super_secure_random_64_character_hex_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Run Applications
```powershell
# Run backend API server
npm run dev:server

# Run frontend React client
npm run dev:client

# Execute automated financial test suites
npm run test
```
