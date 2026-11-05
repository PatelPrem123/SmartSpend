export const CURRENCIES = {
  INR: 'INR',
};

export const ACCOUNT_TYPES = {
  CASH: 'cash',
  SAVINGS: 'savings',
  CURRENT: 'current',
  WALLET: 'wallet',
  CREDIT_CARD: 'credit_card',
  EMERGENCY_FUND: 'emergency_fund',
};

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
};

export const RECURRENCE_FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

export const TRANSACTION_SOURCES = {
  MANUAL: 'manual',
  RECURRING: 'recurring',
  CSV_IMPORT: 'csv_import',
};

export const BUDGET_TIERS = {
  SAFE: { min: 0, max: 74, color: '#10b981', label: 'Safe' },
  WARNING: { min: 75, max: 89, color: '#f59e0b', label: 'Warning' },
  CRITICAL: { min: 90, max: 99, color: '#f97316', label: 'Critical' },
  EXCEEDED: { min: 100, max: Infinity, color: '#ef4444', label: 'Exceeded' },
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#f97316' },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#10b981' },
  { name: 'Housing & Rent', icon: 'Home', color: '#6366f1' },
  { name: 'Utilities', icon: 'Zap', color: '#eab308' },
  { name: 'Transportation', icon: 'Car', color: '#06b6d4' },
  { name: 'Healthcare', icon: 'HeartPulse', color: '#ec4899' },
  { name: 'Entertainment', icon: 'Film', color: '#8b5cf6' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#3b82f6' },
  { name: 'Education', icon: 'BookOpen', color: '#14b8a6' },
  { name: 'Personal Care', icon: 'Smile', color: '#f43f5e' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Briefcase', color: '#10b981' },
  { name: 'Freelance & Consulting', icon: 'Laptop', color: '#06b6d4' },
  { name: 'Investments & Dividends', icon: 'TrendingUp', color: '#6366f1' },
  { name: 'Business Income', icon: 'Store', color: '#f59e0b' },
  { name: 'Rental Income', icon: 'Key', color: '#8b5cf6' },
  { name: 'Gifts & Grants', icon: 'Gift', color: '#ec4899' },
  { name: 'Other Income', icon: 'PlusCircle', color: '#64748b' },
];
