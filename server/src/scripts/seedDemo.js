import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import { SavingsGoal } from '../models/SavingsGoal.js';
import { RecurringRule } from '../models/RecurringRule.js';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../config/constants.js';

async function seedDemoUsers() {
  await connectDB();

  console.log('--- Cleaning previous demo data if any ---');
  await User.deleteMany({ email: { $in: ['demo@smartspend.io', 'admin@smartspend.io'] } });

  // Plaintext password to let pre('save') hash it properly
  const plainPassword = 'Password123!';

  // 1. Create Normal Demo User
  const demoUser = await User.create({
    name: 'Prem Patel',
    email: 'demo@smartspend.io',
    password: plainPassword,
    baseCurrency: 'INR',
    timezone: 'Asia/Kolkata',
    monthlyBudgetLimitMinor: 5000000, // ₹50,000.00
  });

  // Seed default categories for demo user
  const categoriesToInsert = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({ ...cat, type: 'expense', userId: demoUser._id, isDefault: true })),
    ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({ ...cat, type: 'income', userId: demoUser._id, isDefault: true })),
  ];
  const createdCats = await Category.insertMany(categoriesToInsert);

  const salaryCat = createdCats.find((c) => c.name === 'Salary') || createdCats[0];
  const foodCat = createdCats.find((c) => c.name === 'Food & Dining') || createdCats[1];
  const rentCat = createdCats.find((c) => c.name === 'Housing & Rent') || createdCats[2];
  const entCat = createdCats.find((c) => c.name === 'Entertainment') || createdCats[3];

  // Accounts for demo user
  const hdfc = await Account.create({
    userId: demoUser._id,
    name: 'HDFC Bank (Savings)',
    accountType: 'savings',
    openingBalanceMinor: 45000000, // ₹4,50,000.00
    currentBalanceMinor: 58000000, // ₹5,80,000.00
    currency: 'INR',
  });

  const salaryAcc = await Account.create({
    userId: demoUser._id,
    name: 'ICICI Salary Account',
    accountType: 'current',
    openingBalanceMinor: 15000000, // ₹1,50,000.00
    currentBalanceMinor: 21500000, // ₹2,15,000.00
    currency: 'INR',
  });

  const upiWallet = await Account.create({
    userId: demoUser._id,
    name: 'Paytm / UPI Wallet',
    accountType: 'wallet',
    openingBalanceMinor: 2000000, // ₹20,000.00
    currentBalanceMinor: 5025000, // ₹50,250.00
    currency: 'INR',
  });

  // Sample transactions
  const now = new Date();
  await Transaction.create([
    {
      userId: demoUser._id,
      accountId: salaryAcc._id,
      categoryId: salaryCat._id,
      type: 'income',
      amountMinor: 12000000, // ₹1,20,000.00
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 1),
      description: 'Monthly Senior Engineer Salary',
    },
    {
      userId: demoUser._id,
      accountId: hdfc._id,
      categoryId: rentCat._id,
      type: 'expense',
      amountMinor: 2500000, // ₹25,000.00
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 5),
      description: 'Apartment Monthly Rent',
    },
    {
      userId: demoUser._id,
      accountId: upiWallet._id,
      categoryId: foodCat._id,
      type: 'expense',
      amountMinor: 1250000, // ₹12,500.00
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 8),
      description: 'Weekly Supermarket & Organic Groceries',
    },
    {
      userId: demoUser._id,
      accountId: upiWallet._id,
      categoryId: entCat._id,
      type: 'expense',
      amountMinor: 420000, // ₹4,200.00
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 12),
      description: 'Weekend Dining & Movies',
    },
    {
      userId: demoUser._id,
      type: 'transfer',
      amountMinor: 1000000, // ₹10,000.00
      fromAccountId: hdfc._id,
      toAccountId: upiWallet._id,
      transactionDate: new Date(now.getFullYear(), now.getMonth(), 10),
      description: 'Liquid UPI Wallet Top-up from Savings',
    },
  ]);

  // Budget for current month
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  await Budget.create([
    {
      userId: demoUser._id,
      categoryId: foodCat._id,
      monthYear: currentMonthStr,
      amountLimitMinor: 1800000, // ₹18,000.00
      alertThresholdsFired: ['50'],
    },
    {
      userId: demoUser._id,
      categoryId: entCat._id,
      monthYear: currentMonthStr,
      amountLimitMinor: 500000, // ₹5,000.00
      alertThresholdsFired: ['50', '75'],
    },
    {
      userId: demoUser._id,
      categoryId: rentCat._id,
      monthYear: currentMonthStr,
      amountLimitMinor: 2500000, // ₹25,000.00
      alertThresholdsFired: ['50', '75', '90', '100'],
    },
  ]);

  // Savings Goal
  await SavingsGoal.create({
    userId: demoUser._id,
    name: 'Emergency Corpus & SIP Fund',
    targetAmountMinor: 100000000, // ₹10,00,000.00
    currentAmountMinor: 65000000, // ₹6,50,000.00
    targetDate: new Date(now.getFullYear() + 1, 11, 31),
    color: '#059669',
  });

  // 2. Create Admin Demo User
  const adminUser = await User.create({
    name: 'SmartSpend Administrator',
    email: 'admin@smartspend.io',
    password: plainPassword,
    baseCurrency: 'INR',
    timezone: 'Asia/Kolkata',
    monthlyBudgetLimitMinor: 10000000, // ₹1,00,000.00
  });

  const adminCats = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({ ...cat, type: 'expense', userId: adminUser._id, isDefault: true })),
    ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({ ...cat, type: 'income', userId: adminUser._id, isDefault: true })),
  ];
  await Category.insertMany(adminCats);

  await Account.create({
    userId: adminUser._id,
    name: 'Main Treasury & Corporate Account',
    accountType: 'current',
    openingBalanceMinor: 100000000, // ₹10,00,000.00
    currentBalanceMinor: 100000000,
    currency: 'INR',
  });

  console.log('✅ Demo accounts and data seeded successfully!');
  process.exit(0);
}

seedDemoUsers().catch((err) => {
  console.error('Error seeding demo data:', err);
  process.exit(1);
});
