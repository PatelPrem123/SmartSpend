import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isOverall: {
      type: Boolean,
      default: false,
    },
    monthYear: {
      type: String,
      required: [true, 'Month-Year string in YYYY-MM format is required'],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'monthYear must match YYYY-MM format (e.g. 2026-11)'],
      index: true,
    },
    amountLimitMinor: {
      type: Number,
      required: [true, 'Budget limit in minor units (paise) is required'],
      min: [100, 'Minimum budget limit is 100 paise (₹1.00)'],
      validate: {
        validator: Number.isInteger,
        message: 'amountLimitMinor must be an integer paise amount (DEC-002)',
      },
    },
    alertThresholdsFired: {
      type: [String],
      default: [],
      validate: {
        validator: function (tiers) {
          const allowed = ['50', '75', '90', '100'];
          return tiers.every((t) => allowed.includes(t));
        },
        message: 'alertThresholdsFired contains invalid threshold tier',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [250, 'Budget notes cannot exceed 250 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: a user can have at most 1 overall budget per month,
// or 1 budget per specific category per month
budgetSchema.index({ userId: 1, monthYear: 1, categoryId: 1, isOverall: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
