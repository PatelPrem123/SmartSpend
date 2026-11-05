import { z } from 'zod';
import { CURRENCIES } from '../config/constants.js';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  baseCurrency: z.nativeEnum(CURRENCIES).optional().default(CURRENCIES.INR),
  timezone: z.string().optional().default('Asia/Kolkata'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50).optional(),
  timezone: z.string().optional(),
  monthlyBudgetLimitMinor: z
    .number()
    .int('Budget limit must be an integer (paise)')
    .nonnegative('Budget limit cannot be negative')
    .optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'New password must contain at least one letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});
