import { z } from 'zod';
import { TRANSACTION_TYPES } from '../config/constants.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTransactionSchema = z.object({
  type: z.enum([TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE], {
    errorMap: () => ({ message: 'Transaction type must be income or expense' }),
  }),
  amountMinor: z
    .number({ required_error: 'Amount is required' })
    .int('Amount must be an integer minor unit (paise)')
    .positive('Amount must be strictly positive'),
  accountId: z
    .string({ required_error: 'Account ID is required' })
    .regex(objectIdRegex, 'Invalid account ID format'),
  categoryId: z.string().regex(objectIdRegex, 'Invalid category ID format').optional().nullable(),
  transactionDate: z.string().datetime().optional().default(() => new Date().toISOString()),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(1, 'Description cannot be empty')
    .max(250, 'Description cannot exceed 250 characters'),
  notes: z.string().trim().max(500).optional().default(''),
  paymentMethod: z
    .enum(['cash', 'upi', 'net_banking', 'debit_card', 'credit_card', 'cheque', 'other'])
    .optional()
    .default('upi'),
});

export const createTransferSchema = z
  .object({
    fromAccountId: z
      .string({ required_error: 'Source account ID is required' })
      .regex(objectIdRegex, 'Invalid source account ID format'),
    toAccountId: z
      .string({ required_error: 'Destination account ID is required' })
      .regex(objectIdRegex, 'Invalid destination account ID format'),
    amountMinor: z
      .number({ required_error: 'Transfer amount is required' })
      .int('Transfer amount must be an integer minor unit (paise)')
      .positive('Transfer amount must be strictly positive'),
    transactionDate: z.string().datetime().optional().default(() => new Date().toISOString()),
    description: z.string().trim().min(1).max(250).optional().default('Account Transfer'),
    notes: z.string().trim().max(500).optional().default(''),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Source and destination accounts must be distinct',
    path: ['toAccountId'],
  });

export const updateTransactionSchema = z.object({
  amountMinor: z
    .number()
    .int('Amount must be an integer minor unit (paise)')
    .positive('Amount must be strictly positive')
    .optional(),
  categoryId: z.string().regex(objectIdRegex).optional().nullable(),
  transactionDate: z.string().datetime().optional(),
  description: z.string().trim().min(1).max(250).optional(),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z
    .enum(['cash', 'upi', 'net_banking', 'debit_card', 'credit_card', 'cheque', 'other'])
    .optional(),
});

export const queryTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum([TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE, TRANSACTION_TYPES.TRANSFER]).optional(),
  accountId: z.string().regex(objectIdRegex).optional(),
  categoryId: z.string().regex(objectIdRegex).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});
