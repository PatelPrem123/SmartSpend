import { z } from 'zod';

export const createBudgetSchema = z
  .object({
    monthYear: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'monthYear must match YYYY-MM format (e.g. 2026-11)'),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID format')
      .optional()
      .nullable(),
    isOverall: z.boolean().optional().default(false),
    amountLimitMinor: z
      .number({ required_error: 'Budget amount limit in paise is required' })
      .int('Budget amount limit must be an integer paise amount (DEC-002)')
      .positive('Budget amount limit must be greater than zero')
      .min(100, 'Minimum budget amount limit is 100 paise (₹1.00)'),
    notes: z.string().max(250, 'Notes cannot exceed 250 characters').optional().default(''),
  })
  .refine((data) => data.isOverall || !!data.categoryId, {
    message: 'Either categoryId must be selected or isOverall must be set to true',
    path: ['categoryId'],
  });

export const updateBudgetSchema = z.object({
  amountLimitMinor: z
    .number()
    .int('Budget amount limit must be an integer paise amount (DEC-002)')
    .positive('Budget amount limit must be greater than zero')
    .min(100, 'Minimum budget amount limit is 100 paise (₹1.00)')
    .optional(),
  notes: z.string().max(250, 'Notes cannot exceed 250 characters').optional(),
});
