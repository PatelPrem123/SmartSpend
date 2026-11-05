import mongoose from 'mongoose';
import { TRANSACTION_TYPES, TRANSACTION_SOURCES, CURRENCIES } from '../config/constants.js';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must belong to a user'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: Object.values(TRANSACTION_TYPES),
      index: true,
    },
    amountMinor: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'Amount must be a strictly positive integer in minor currency units (paise)',
      },
      index: true,
    },
    currency: {
      type: String,
      default: CURRENCIES.INR,
      uppercase: true,
    },
    // Primary account for Income or Expense
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
      required: function () {
        return this.type === TRANSACTION_TYPES.INCOME || this.type === TRANSACTION_TYPES.EXPENSE;
      },
    },
    // Source account for Transfer
    fromAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
      required: function () {
        return this.type === TRANSACTION_TYPES.TRANSFER;
      },
    },
    // Destination account for Transfer
    toAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      index: true,
      required: function () {
        return this.type === TRANSACTION_TYPES.TRANSFER;
      },
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
      default: null,
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Transaction description is required'],
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'net_banking', 'debit_card', 'credit_card', 'cheque', 'other'],
      default: 'upi',
    },
    source: {
      type: String,
      enum: Object.values(TRANSACTION_SOURCES),
      default: TRANSACTION_SOURCES.MANUAL,
    },
    recurrenceRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringRule',
      default: null,
    },
    importBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImportBatch',
      default: null,
    },
    receiptUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes for tenant filtering and chronological ledger sweeps
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, accountId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, type: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, transactionDate: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
