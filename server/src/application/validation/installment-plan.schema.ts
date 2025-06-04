import { z } from 'zod';

// Request validation schemas
export const CreateInstallmentPlanSchema = z.object({
  totalAmount: z.number().positive('Total amount must be positive'),
  currency: z.string().min(3).max(3).default('BRL'),
  purchaseDate: z.string().datetime('Invalid date format. Use ISO 8601 format'),
  installmentCount: z.number().int().min(2, 'Installment count must be at least 2').max(60, 'Installment count cannot exceed 60'),
  description: z.string().min(1, 'Description is required').max(200, 'Description cannot exceed 200 characters'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
}).refine(
  (data) => {
    const purchaseDate = new Date(data.purchaseDate);
    const futureLimit = new Date();
    futureLimit.setFullYear(futureLimit.getFullYear() + 1);
    return purchaseDate <= futureLimit;
  },
  {
    message: 'Purchase date cannot be more than 1 year in the future',
    path: ['purchaseDate'],
  }
);

export const UpdateInstallmentPlanSchema = z.object({
  description: z.string().min(1, 'Description cannot be empty').max(200, 'Description cannot exceed 200 characters').optional(),
});

// Response schemas
const InstallmentPlanStatusSchema = z.enum(['active', 'completed', 'cancelled']);

export const InstallmentPlanResponseSchema = z.object({
  id: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  purchaseDate: z.string().datetime(),
  installmentCount: z.number().int(),
  monthlyAmount: z.number(),
  description: z.string(),
  paymentMethodId: z.string(),
  categoryId: z.string(),
  status: InstallmentPlanStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const InstallmentProgressResponseSchema = z.object({
  planId: z.string(),
  description: z.string(),
  totalInstallments: z.number().int(),
  paidInstallments: z.number().int(),
  remainingInstallments: z.number().int(),
  totalAmount: z.number(),
  currency: z.string(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  progressPercentage: z.number().min(0).max(100),
  isCompleted: z.boolean(),
  nextInstallmentDate: z.string().datetime().nullable(),
});

// Common validation schemas
export const InstallmentPlanIdParamSchema = z.object({
  id: z.string().min(1, 'Installment plan ID is required'),
});

// Type exports
export type CreateInstallmentPlanRequest = z.infer<typeof CreateInstallmentPlanSchema>;
export type UpdateInstallmentPlanRequest = z.infer<typeof UpdateInstallmentPlanSchema>;
export type InstallmentPlanResponse = z.infer<typeof InstallmentPlanResponseSchema>;
export type InstallmentProgressResponse = z.infer<typeof InstallmentProgressResponseSchema>;
export type InstallmentPlanIdParam = z.infer<typeof InstallmentPlanIdParamSchema>; 