import { z } from 'zod';
import { ACCOUNT_TYPES } from '../config/constants.js';

export const createAccountSchema = z.object({
  name: z
    .string({ required_error: 'Account name is required' })
    .trim()
    .min(2, 'Account name must be at least 2 characters')
    .max(50, 'Account name cannot exceed 50 characters'),
  accountType: z.nativeEnum(ACCOUNT_TYPES, {
    errorMap: () => ({ message: 'Please select a valid account classification' }),
  }),
  openingBalanceMinor: z
    .number({ required_error: 'Opening balance is required' })
    .int('Opening balance must be an integer minor unit (paise)'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color code')
    .optional()
    .default('#047857'),
  icon: z.string().trim().optional().default('Wallet'),
  notes: z.string().trim().max(250).optional().default(''),
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  accountType: z.nativeEnum(ACCOUNT_TYPES).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  icon: z.string().trim().optional(),
  isArchived: z.boolean().optional(),
  notes: z.string().trim().max(250).optional(),
});
