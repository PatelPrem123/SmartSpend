import { z } from 'zod';
import { TRANSACTION_TYPES } from '../config/constants.js';

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(60, 'Category name cannot exceed 60 characters'),
  type: z.enum([TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE], {
    errorMap: () => ({ message: 'Category type must be either income or expense' }),
  }),
  icon: z.string().trim().optional().default('Tag'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color code')
    .optional()
    .default('#047857'),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  icon: z.string().trim().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  isArchived: z.boolean().optional(),
});
