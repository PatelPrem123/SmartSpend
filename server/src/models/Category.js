import mongoose from 'mongoose';
import { TRANSACTION_TYPES } from '../config/constants.js';

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Category must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    type: {
      type: String,
      required: [true, 'Category type is required'],
      enum: [TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE],
      index: true,
    },
    icon: {
      type: String,
      default: 'Tag',
      trim: true,
    },
    color: {
      type: String,
      default: '#047857',
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Please provide a valid hex color code'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index enforcing unique category name per type for each user
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
