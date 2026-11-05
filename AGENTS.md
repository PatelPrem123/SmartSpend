# SmartSpend — Autonomous Agent Engineering & Quality Contract (AGENTS.md)

This file governs all autonomous AI coding agents, senior engineers, and code review assistants working on **SmartSpend**.

---

## 1. Master AI Code Testing & QA Rules

When performing testing, code reviews, or implementing features:
1. **Never Assume Code is Correct:** Inspect actual implementations, verify edge cases, and run tests.
2. **Never Invent Test Results:** Distinguish clearly between code that was manually reviewed and tests that were actually executed. Do not claim tests passed unless executed via terminal with exit code 0.
3. **Comprehensive Review Scope:** Every module must undergo:
   - **Code Quality Review:** Readability, dead code elimination, unused imports, naming conventions, DRY/KISS.
   - **Functional & Logic Verification:** Integer paise precision, zero-income division guards, transfer neutrality.
   - **Unit & Integration Testing:** Boundary conditions, Vitest assertions, Supertest API checks.
   - **Edge Case Hardening:** Null/undefined, empty strings, oversized inputs, float precision exhaustion, concurrent requests.
   - **Security Validation:** NoSQL injection, XSS, CSRF, BOLA/IDOR, CSV formula injection, cookie security.
   - **Performance & Concurrency Testing:** Compound indexes, streaming CSV/Excel pipelines, atomic transfers.
4. **Preserve Existing Business Logic:** Never break working functionality or silently alter database schemas, route paths, or expected JSON contracts.

---

## 2. Professional Human-Code Engineering Standards

All code generated, refactored, or reviewed must reflect senior developer standards:
- **Clean Code & SOLID:** Single responsibility per function and module, clean dependency separation.
- **KISS & DRY:** Avoid over-engineering, unnecessary abstractions, and redundant boilerplate.
- **Natural, Professional Style:** Avoid artificial comments explaining obvious syntax; write descriptive, context-rich code.
- **Strict Error Handling:** Centralized async wrappers, meaningful error responses, and zero unhandled promise rejections.
- **Strict Typing & Schema Validation:** Enforce Zod validation on all API boundaries with integer minor currency limits.

---

## 3. Architecture & Decision Governance (DECISIONS.md)

1. **Mandatory Check:** Before making architecture or schema changes, consult `DECISIONS.md`.
2. **Honor Confirmed Decisions:** Decisions marked `CONFIRMED` (such as Integer Minor Currency in `DEC-002`, Transfer Neutrality in `DEC-003`, Idempotent Budget Alerts in `DEC-004`, node-cron Daemon in `DEC-005`, and CSV Sanitization in `DEC-006`) are non-negotiable constraints.
3. **No Unapproved Rewrites:** Never replace an intentional architectural pattern with a generic alternative without human approval.

---

## 4. Impact Mapping Protocol (IMPACT-MAP.md)

Before touching shared services, models, middleware, or cron jobs:
1. Cross-reference `IMPACT-MAP.md` to identify direct and indirect consumers.
2. Verify security boundaries (e.g. `userId` scoping across queries).
3. Review corresponding test suites in `server/tests/`.

---

## 5. Security & Read-Only Backdoor Audit Protocol

1. **Zero Backdoors:** Strictly prohibit bypass flags (`BYPASS_AUTH`, `DEBUG=true`, `SKIP_AUTH`), hardcoded credentials, mock sessions, or undocumented endpoints in production.
2. **Financial Isolation:** Ensure user accounts, transactions, and balances are strictly isolated with `userId: req.user.id`.
3. **Input Sanitization:** Sanitize descriptions and notes with DOMPurify; sanitize CSV cells starting with `=`, `+`, `-`, or `@`.
4. **Integer Currency Rule:** Under no circumstance allow floating-point values into monetary database columns.
