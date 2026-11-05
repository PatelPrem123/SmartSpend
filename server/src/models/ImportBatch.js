import mongoose from 'mongoose';

const importBatchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Account ID is required'],
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    importedCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    totalIncomeMinor: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'totalIncomeMinor must be an integer paise amount (DEC-002)',
      },
    },
    totalExpenseMinor: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'totalExpenseMinor must be an integer paise amount (DEC-002)',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

importBatchSchema.index({ userId: 1, createdAt: -1 });

export const ImportBatch = mongoose.model('ImportBatch', importBatchSchema);
