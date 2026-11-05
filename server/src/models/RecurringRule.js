import mongoose from 'mongoose';
import {
  TRANSACTION_TYPES,
  RECURRENCE_FREQUENCIES,
  CURRENCIES,
} from '../config/constants.js';

const recurringRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Rule title or name is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: [true, 'Transaction type is required'],
    },
    amountMinor: {
      type: Number,
      required: [true, 'Amount in minor units (paise) is required'],
      validate: {
        validator: function (v) {
          return Number.isInteger(v) && v > 0;
        },
        message: 'amountMinor must be a strictly positive integer in minor units (DEC-002)',
      },
    },
    currency: {
      type: String,
      default: CURRENCIES.INR,
      uppercase: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: function () {
        return this.type === TRANSACTION_TYPES.INCOME || this.type === TRANSACTION_TYPES.EXPENSE;
      },
    },
    fromAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: function () {
        return this.type === TRANSACTION_TYPES.TRANSFER;
      },
    },
    toAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: function () {
        return this.type === TRANSACTION_TYPES.TRANSFER;
      },
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    frequency: {
      type: String,
      enum: Object.values(RECURRENCE_FREQUENCIES),
      required: [true, 'Recurrence frequency is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      required: [true, 'nextRunAt date is required'],
      index: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'net_banking', 'debit_card', 'credit_card', 'cheque', 'other'],
      default: 'upi',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    totalGeneratedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound index for daemon sweep
recurringRuleSchema.index({ isActive: 1, nextRunAt: 1 });
recurringRuleSchema.index({ userId: 1, isActive: 1, nextRunAt: 1 });

export const RecurringRule = mongoose.model('RecurringRule', recurringRuleSchema);
