import { z } from 'zod';

// Bucket transfer type schema
const BucketTransferTypeSchema = z.enum(['deposit', 'withdrawal'], {
  errorMap: () => ({ message: 'Transfer type must be deposit or withdrawal' }),
});

// Request validation schemas
export const CreateSavingsBucketSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  targetAmount: z.number().positive('Target amount must be positive').optional(),
  currency: z.string().min(3).max(3).default('BRL'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  initialBalance: z.number().min(0, 'Initial balance cannot be negative').optional(),
});

export const UpdateSavingsBucketSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100, 'Name cannot exceed 100 characters').optional(),
  targetAmount: z.number().positive('Target amount must be positive').nullable().optional(),
  currency: z.string().min(3).max(3).optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').nullable().optional(),
});

export const TransferToBucketSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3).default('BRL'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  type: BucketTransferTypeSchema,
});

// Response schemas
export const SavingsBucketResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number().nullable(),
  currency: z.string(),
  currentBalance: z.number(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  progressPercentage: z.number().min(0).max(100).nullable(),
  remainingAmount: z.number().nullable(),
  isTargetReached: z.boolean(),
});

export const BucketTransferResponseSchema = z.object({
  id: z.string(),
  bucketId: z.string(),
  amount: z.number(),
  currency: z.string(),
  type: BucketTransferTypeSchema,
  description: z.string().nullable(),
  date: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const BucketSummaryResponseSchema = z.object({
  bucketId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  currentBalance: z.number(),
  currency: z.string(),
  targetAmount: z.number().nullable(),
  progressPercentage: z.number().min(0).max(100).nullable(),
  remainingAmount: z.number().nullable(),
  isTargetReached: z.boolean(),
  totalDeposits: z.number(),
  totalWithdrawals: z.number(),
  transferCount: z.number().int().min(0),
  isActive: z.boolean(),
});

// Common validation schemas for API
export const SavingsBucketIdParamSchema = z.object({
  id: z.string().min(1, 'Savings bucket ID is required'),
});

export const SavingsBucketListQuerySchema = z.object({
  active: z.coerce.boolean().optional(),
  hasTarget: z.coerce.boolean().optional(),
  targetReached: z.coerce.boolean().optional(),
});

export const BucketTransferListQuerySchema = z.object({
  bucketId: z.string().optional(),
  type: BucketTransferTypeSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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

// Type exports for TypeScript inference
export type CreateSavingsBucketRequest = z.infer<typeof CreateSavingsBucketSchema>;
export type UpdateSavingsBucketRequest = z.infer<typeof UpdateSavingsBucketSchema>;
export type TransferToBucketRequest = z.infer<typeof TransferToBucketSchema>;
export type SavingsBucketResponse = z.infer<typeof SavingsBucketResponseSchema>;
export type BucketTransferResponse = z.infer<typeof BucketTransferResponseSchema>;
export type BucketSummaryResponse = z.infer<typeof BucketSummaryResponseSchema>;
export type SavingsBucketIdParam = z.infer<typeof SavingsBucketIdParamSchema>;
export type SavingsBucketListQuery = z.infer<typeof SavingsBucketListQuerySchema>;
export type BucketTransferListQuery = z.infer<typeof BucketTransferListQuerySchema>; 