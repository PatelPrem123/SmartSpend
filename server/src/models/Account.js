import mongoose from 'mongoose';
import { ACCOUNT_TYPES, CURRENCIES } from '../config/constants.js';

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Account must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide an account name'],
      trim: true,
      maxlength: [50, 'Account name cannot exceed 50 characters'],
    },
    accountType: {
      type: String,
      required: [true, 'Please specify an account type'],
      enum: Object.values(ACCOUNT_TYPES),
      index: true,
    },
    openingBalanceMinor: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Opening balance must be an integer minor unit (paise)',
      },
    },
    currentBalanceMinor: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Current balance must be an integer minor unit (paise)',
      },
    },
    currency: {
      type: String,
      default: CURRENCIES.INR,
      uppercase: true,
    },
    color: {
      type: String,
      default: '#047857',
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Please provide a valid hex color code'],
    },
    icon: {
      type: String,
      default: 'Wallet',
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [250, 'Notes cannot exceed 250 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch a user's active accounts
accountSchema.index({ userId: 1, isArchived: 1 });
accountSchema.index({ userId: 1, name: 1 }, { unique: true });

// Sync currentBalanceMinor to openingBalanceMinor on initial save
accountSchema.pre('save', function (next) {
  if (this.isNew && (this.currentBalanceMinor === 0 || this.currentBalanceMinor === undefined)) {
    this.currentBalanceMinor = this.openingBalanceMinor;
  }
  next();
});

export const Account = mongoose.model('Account', accountSchema);
