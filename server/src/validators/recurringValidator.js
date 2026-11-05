import { z } from 'zod';
import {
  TRANSACTION_TYPES,
  RECURRENCE_FREQUENCIES,
} from '../config/constants.js';

export const createRecurringRuleSchema = z
  .object({
    title: z
      .string({ required_error: 'Rule title is required' })
      .trim()
      .min(1, 'Title cannot be empty')
      .max(120, 'Title cannot exceed 120 characters'),
    type: z.enum([
      TRANSACTION_TYPES.INCOME,
      TRANSACTION_TYPES.EXPENSE,
      TRANSACTION_TYPES.TRANSFER,
    ]),
    amountMinor: z
      .number({ required_error: 'Amount in paise is required' })
      .int('Amount must be an integer paise amount (DEC-002)')
      .positive('Amount must be greater than zero'),
    accountId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Account ID format')
      .optional()
      .nullable(),
    fromAccountId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Source Account ID format')
      .optional()
      .nullable(),
    toAccountId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Destination Account ID format')
      .optional()
      .nullable(),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID format')
      .optional()
      .nullable(),
    frequency: z.enum([
      RECURRENCE_FREQUENCIES.DAILY,
      RECURRENCE_FREQUENCIES.WEEKLY,
      RECURRENCE_FREQUENCIES.MONTHLY,
      RECURRENCE_FREQUENCIES.YEARLY,
    ]),
    startDate: z.string().datetime().or(z.string()).optional(),
    endDate: z.string().datetime().or(z.string()).optional().nullable(),
    paymentMethod: z
      .enum(['cash', 'upi', 'net_banking', 'debit_card', 'credit_card', 'cheque', 'other'])
      .optional()
      .default('upi'),
    description: z.string().max(250).optional().default(''),
    notes: z.string().max(500).optional().default(''),
  })
  .refine(
    (data) => {
      if (data.type === TRANSACTION_TYPES.INCOME || data.type === TRANSACTION_TYPES.EXPENSE) {
        return !!data.accountId;
      }
      return true;
    },
    {
      message: 'accountId is required for income and expense recurring rules',
      path: ['accountId'],
    }
  )
  .refine(
    (data) => {
      if (data.type === TRANSACTION_TYPES.TRANSFER) {
        return !!data.fromAccountId && !!data.toAccountId && data.fromAccountId !== data.toAccountId;
      }
      return true;
    },
    {
      message: 'Distinct fromAccountId and toAccountId are required for transfer recurring rules',
      path: ['toAccountId'],
    }
  );

export const updateRecurringRuleSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  amountMinor: z
    .number()
    .int('Amount must be an integer paise amount (DEC-002)')
    .positive('Amount must be greater than zero')
    .optional(),
  frequency: z
    .enum([
      RECURRENCE_FREQUENCIES.DAILY,
      RECURRENCE_FREQUENCIES.WEEKLY,
      RECURRENCE_FREQUENCIES.MONTHLY,
      RECURRENCE_FREQUENCIES.YEARLY,
    ])
    .optional(),
  isActive: z.boolean().optional(),
  endDate: z.string().datetime().or(z.string()).optional().nullable(),
  paymentMethod: z
    .enum(['cash', 'upi', 'net_banking', 'debit_card', 'credit_card', 'cheque', 'other'])
    .optional(),
  description: z.string().max(250).optional(),
  notes: z.string().max(500).optional(),
});
