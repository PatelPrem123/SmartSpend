import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      minlength: [2, 'Goal name must be at least 2 characters'],
      maxlength: [100, 'Goal name cannot exceed 100 characters'],
    },
    targetAmountMinor: {
      type: Number,
      required: [true, 'Target amount in paise is required'],
      min: [100, 'Target amount must be at least ₹1.00 (100 paise)'],
      validate: {
        validator: Number.isInteger,
        message: 'targetAmountMinor must be an integer paise amount (DEC-002)',
      },
    },
    currentAmountMinor: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'currentAmountMinor must be an integer paise amount (DEC-002)',
      },
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required'],
    },
    category: {
      type: String,
      enum: [
        'Emergency Fund',
        'Retirement',
        'Home Purchase',
        'Vehicle',
        'Vacation',
        'Education',
        'Gadget',
        'Wedding',
        'Investment',
        'Other',
      ],
      default: 'Other',
    },
    color: {
      type: String,
      default: '#10b981',
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color code'],
    },
    icon: {
      type: String,
      default: 'Target',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'cancelled'],
      default: 'active',
      index: true,
    },
    isReached: {
      type: Boolean,
      default: false,
    },
    reachedAt: {
      type: Date,
      default: null,
    },
    milestonesFired: {
      type: [String], // ['25', '50', '75', '100']
      default: [],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

savingsGoalSchema.virtual('progressPercentage').get(function () {
  if (!this.targetAmountMinor || this.targetAmountMinor <= 0) return 0;
  return Math.min(100, Math.round((this.currentAmountMinor / this.targetAmountMinor) * 100));
});

savingsGoalSchema.virtual('remainingAmountMinor').get(function () {
  return Math.max(0, this.targetAmountMinor - this.currentAmountMinor);
});

savingsGoalSchema.index({ userId: 1, status: 1 });
savingsGoalSchema.index({ userId: 1, targetDate: 1 });

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);
