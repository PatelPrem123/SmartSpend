import mongoose from 'mongoose';

const goalContributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    amountMinor: {
      type: Number,
      required: [true, 'Contribution amount in paise is required'],
      min: [100, 'Contribution amount must be at least ₹1.00 (100 paise)'],
      validate: {
        validator: Number.isInteger,
        message: 'amountMinor must be an integer paise amount (DEC-002)',
      },
    },
    contributionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

goalContributionSchema.index({ userId: 1, goalId: 1, contributionDate: -1 });
goalContributionSchema.index({ goalId: 1, contributionDate: -1 });

export const GoalContribution = mongoose.model('GoalContribution', goalContributionSchema);
