import { z } from 'zod';

export const createGoalSchema = z.object({
  name: z
    .string({ required_error: 'Goal name is required' })
    .trim()
    .min(2, 'Goal name must be at least 2 characters')
    .max(100, 'Goal name cannot exceed 100 characters'),
  targetAmountMinor: z
    .number({ required_error: 'Target amount in paise is required' })
    .int('Target amount must be an integer paise amount (DEC-002)')
    .positive('Target amount must be greater than zero')
    .min(100, 'Minimum target amount is 100 paise (₹1.00)'),
  targetDate: z
    .string({ required_error: 'Target date is required' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'targetDate must be a valid ISO date or YYYY-MM-DD string',
    }),
  category: z
    .enum([
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
    ])
    .optional()
    .default('Other'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color code')
    .optional()
    .default('#10b981'),
  icon: z.string().optional().default('Target'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().default(''),
});

export const updateGoalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Goal name must be at least 2 characters')
    .max(100, 'Goal name cannot exceed 100 characters')
    .optional(),
  targetAmountMinor: z
    .number()
    .int('Target amount must be an integer paise amount (DEC-002)')
    .positive('Target amount must be greater than zero')
    .min(100, 'Minimum target amount is 100 paise (₹1.00)')
    .optional(),
  targetDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'targetDate must be a valid date',
    })
    .optional(),
  category: z
    .enum([
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
    ])
    .optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color code')
    .optional(),
  icon: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const createContributionSchema = z.object({
  amountMinor: z
    .number({ required_error: 'Contribution amount in paise is required' })
    .int('Contribution amount must be an integer paise amount (DEC-002)')
    .positive('Contribution amount must be greater than zero')
    .min(100, 'Minimum contribution amount is 100 paise (₹1.00)'),
  accountId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Account ID format')
    .optional()
    .nullable(),
  contributionDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'contributionDate must be a valid date',
    })
    .optional(),
  notes: z.string().max(300, 'Notes cannot exceed 300 characters').optional().default(''),
});
