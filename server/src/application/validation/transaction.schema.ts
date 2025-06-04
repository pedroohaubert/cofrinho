import { z } from 'zod';

// Base schemas
const MoneySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('BRL'),
});

const TransactionTypeSchema = z.enum(['income', 'expense'], {
  errorMap: () => ({ message: 'Type must be either income or expense' }),
});

const TransactionSourceSchema = z.enum(['manual', 'installment', 'subscription'], {
  errorMap: () => ({ message: 'Source must be manual, installment, or subscription' }),
});

// Request validation schemas
export const CreateTransactionSchema = z.object({
  date: z.string().datetime('Invalid date format. Use ISO 8601 format'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3).default('BRL'),
  categoryId: z.string().min(1, 'Category ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  type: TransactionTypeSchema,
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
});

export const UpdateTransactionSchema = z.object({
  date: z.string().datetime('Invalid date format. Use ISO 8601 format').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().min(3).max(3).optional(),
  categoryId: z.string().min(1, 'Category ID cannot be empty').optional(),
  paymentMethodId: z.string().min(1, 'Payment method ID cannot be empty').optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').nullable().optional(),
});

export const ListTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: TransactionTypeSchema.optional(),
  source: TransactionSourceSchema.optional(),
  description: z.string().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
).refine(
  (data) => {
    if (data.minAmount && data.maxAmount) {
      return data.minAmount <= data.maxAmount;
    }
    return true;
  },
  {
    message: 'Minimum amount must be less than or equal to maximum amount',
    path: ['minAmount'],
  }
);

// Response schemas
export const TransactionResponseSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  amount: z.number(),
  currency: z.string(),
  categoryId: z.string(),
  paymentMethodId: z.string(),
  type: TransactionTypeSchema,
  description: z.string().nullable(),
  source: TransactionSourceSchema,
  sourceId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PaginatedTransactionsResponseSchema = z.object({
  items: z.array(TransactionResponseSchema),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});

// Common validation schemas for API
export const TransactionIdParamSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
});

// Type exports for TypeScript inference
export type CreateTransactionRequest = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof UpdateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type PaginatedTransactionsResponse = z.infer<typeof PaginatedTransactionsResponseSchema>;
export type TransactionIdParam = z.infer<typeof TransactionIdParamSchema>; 