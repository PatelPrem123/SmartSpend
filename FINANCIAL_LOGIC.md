# SmartSpend — Mathematical Ledger Formulation & Financial Logic (FINANCIAL_LOGIC.md)

**Document Standard:** Senior Financial Systems Engineering  
**Precision Non-Negotiable:** 64-bit Integer Minor Units (Paise for INR: ₹1.00 = 100 paise)  
**Governance:** `DEC-002`, `DEC-003`, `DEC-010`

---

## 1. The Integer Minor Currency Standard (DEC-002)

### The IEEE 754 Floating-Point Problem
In financial software, standard double-precision floating-point arithmetic introduces cumulative precision loss due to base-2 binary representation of decimal fractions:

$$0.1 + 0.2 = 0.30000000000000004$$

In a ledger with thousands of entries, floating-point rounding drifts generate off-by-one errors, broken reconciliation balances, and failed financial audits.

### The SmartSpend Solution
SmartSpend strictly forbids storing or computing monetary amounts as floating-point decimals. All database schemas, calculation engines, and validators mandate integer minor currency units:

$$\text{1 Indian Rupee (INR)} = 100\text{ paise}$$

| Rupee Display | Stored Integer (Paise) | Math Type |
| :--- | :--- | :--- |
| `₹1.00` | `100` | 64-bit Integer |
| `₹1,250.50` | `125050` | 64-bit Integer |
| `₹50,000.00` | `5000000` | 64-bit Integer |
| `₹1,00,00,000.00` (1 Crore) | `1000000000` | 64-bit Integer |

Conversion to human-readable rupee strings occurs **exclusively at the UI presentation boundary** using `Intl.NumberFormat('en-IN')`.

---

## 2. Core Ledger Formulas & Balance Derivations

### 1. Account Balance Derivation Formula
The exact mathematical balance of an account $A$ is derived deterministically from raw historical ledger events:

$$\text{Balance}(A) = \text{Opening}(A) + \sum \text{Income}(A) - \sum \text{Expense}(A) + \sum \text{TransfersIn}(A) - \sum \text{TransfersOut}(A)$$

Where:
- $\text{Opening}(A)$: Immutable initial balance at account creation time (paise).
- $\sum \text{Income}(A)$: Sum of all approved transactions where `accountId = A` and `type = 'income'`.
- $\sum \text{Expense}(A)$: Sum of all approved transactions where `accountId = A` and `type = 'expense'`.
- $\sum \text{TransfersIn}(A)$: Sum of all transfer transactions where `toAccountId = A` and `type = 'transfer'`.
- $\sum \text{TransfersOut}(A)$: Sum of all transfer transactions where `fromAccountId = A` and `type = 'transfer'`.

---

### 2. Proof of Transfer Neutrality (DEC-003)

In standard personal finance trackers, withdrawing cash from an ATM or moving money from a bank account to a UPI wallet is frequently misclassified as an "Expense", artificially inflating spending figures and creating false deficits.

SmartSpend enforces **Transfer Neutrality**:
1. An inter-account transfer is stored as a single atomic transaction document with `type = 'transfer'`.
2. Symmetrical mutation: `fromAccount.currentBalanceMinor` is decremented by $X$ paise, and `toAccount.currentBalanceMinor` is incremented by $X$ paise simultaneously.
3. Total liquid wealth across the user's portfolio remains strictly unchanged:

$$\Delta \text{Net Worth} = (+X) + (-X) = 0$$

4. Aggregation pipelines computing Monthly Income, Monthly Expense, and Net Cash Flow filter strictly by `{ type: { $in: ['income', 'expense'] } }`. Transfers are completely excluded from P&L statements.

---

### 3. Net Cash Flow Formulation
Net Cash Flow represents actual liquid capital retained during a financial period:

$$\text{Net Cash Flow} = \sum \text{Income} - \sum \text{Expense}$$

Transfers are excluded. If $\text{Income} > \text{Expense}$, the user experiences positive cash velocity. If $\text{Expense} > \text{Income}$, the user experiences a cash burn deficit.

---

### 4. Zero-Income Safe Savings Rate Formulation (DEC-010)

Standard financial formula for Savings Rate:

$$\text{Savings Rate} = \frac{\text{Total Income} - \text{Total Expenses}}{\text{Total Income}} \times 100$$

#### The Zero-Income Edge Case
If a user starts a fresh month, creates an account, or has zero recorded income ($\text{Total Income} = 0$), evaluating this formula naively in JavaScript causes catastrophic mathematical failures:

$$\frac{0 - 5000}{0} \times 100 = -\infty \quad (\text{or } \text{NaN if } 0/0)$$

This crashes React chart engines and corrupts dashboard JSON responses.

#### SmartSpend Mathematical Guard:
```javascript
export function calculateSavingsRate(totalIncomeMinor, totalExpenseMinor) {
  if (!totalIncomeMinor || totalIncomeMinor <= 0) {
    return 0; // Return clean 0% rather than NaN or -Infinity
  }
  const netSavings = totalIncomeMinor - totalExpenseMinor;
  const rate = (netSavings / totalIncomeMinor) * 100;
  return Math.round(rate * 10) / 10; // Rounded to 1 decimal place
}
```

---

### 5. Budget Utilization & Tier Classification (DEC-004)

Budget utilization evaluates category expenditures against approved limits:

$$\text{Utilization (\%)} = \frac{\text{Eligible Category Expenses}}{\text{Budget Amount Limit}} \times 100$$

#### Utilization Tiers & Threshold Alerts

| Tier | Utilization Range | UI Visual Badge | In-App Notification Trigger |
| :--- | :--- | :--- | :---: |
| **Safe** | $0\% - 74\%$ | Emerald (`#10b981`) | 50% Milestone |
| **Warning** | $75\% - 89\%$ | Amber (`#f59e0b`) | 75% Warning Alert |
| **Critical** | $90\% - 99\%$ | Orange (`#f97316`) | 90% Approaching Cap Alert |
| **Exceeded** | $\ge 100\%$ | Rose Red (`#ef4444`) | 100% Budget Overrun Alert |

#### Distributed Idempotency Array (`alertThresholdsFired`)
To prevent alert spam when consecutive transactions are recorded in the same tier:
1. Every `Budget` document maintains `alertThresholdsFired: [String]`.
2. When a threshold is crossed (e.g. 75%), the system executes an atomic MongoDB update:
   ```javascript
   await Budget.findOneAndUpdate(
     { _id: budget._id, alertThresholdsFired: { $ne: '75' } },
     { $push: { alertThresholdsFired: '75' } }
   );
   ```
3. If the update modifies 1 document, the notification is emitted. If 0 documents are modified, the notification was already delivered during this cycle and is skipped.
