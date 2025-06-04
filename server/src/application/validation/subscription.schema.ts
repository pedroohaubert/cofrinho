import { z } from 'zod';

// Subscription status schema
const SubscriptionStatusSchema = z.enum(['active', 'cancelled', 'paused'], {
  errorMap: () => ({ message: 'Status must be active, cancelled, or paused' }),
});

// Request validation schemas
export const CreateSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name cannot exceed 200 characters'),
  monthlyAmount: z.number().positive('Monthly amount must be positive'),
  currency: z.string().min(3).max(3).default('BRL'),
  startDate: z.string().datetime('Invalid date format. Use ISO 8601 format'),
  categoryId: z.string().min(1, 'Category ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
  endDate: z.string().datetime('Invalid date format. Use ISO 8601 format').optional(),
}).refine(
  (data) => {
    if (data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => {
    const startDate = new Date(data.startDate);
    const futureLimit = new Date();
    futureLimit.setFullYear(futureLimit.getFullYear() + 10);
    return startDate <= futureLimit;
  },
  {
    message: 'Start date cannot be more than 10 years in the future',
    path: ['startDate'],
  }
);

export const UpdateSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(200, 'Name cannot exceed 200 characters').optional(),
});

export const CancelSubscriptionSchema = z.object({
  endDate: z.string().datetime('Invalid date format. Use ISO 8601 format').optional(),
}).refine(
  (data) => {
    if (data.endDate) {
      const endDate = new Date(data.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return endDate >= today;
    }
    return true;
  },
  {
    message: 'End date cannot be in the past',
    path: ['endDate'],
  }
);

// Response schemas
export const SubscriptionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  monthlyAmount: z.number(),
  currency: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable(),
  categoryId: z.string(),
  paymentMethodId: z.string(),
  status: SubscriptionStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const SubscriptionOverviewResponseSchema = z.object({
  subscriptionId: z.string(),
  name: z.string(),
  monthlyAmount: z.number(),
  currency: z.string(),
  status: SubscriptionStatusSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable(),
  monthsActive: z.number().int().min(0),
  totalPaid: z.number(),
  nextPaymentDate: z.string().datetime().nullable(),
  isActive: z.boolean(),
  paymentCount: z.number().int().min(0),
});

export const UpcomingPaymentResponseSchema = z.object({
  subscriptionId: z.string(),
  subscriptionName: z.string(),
  amount: z.number(),
  currency: z.string(),
  dueDate: z.string().datetime(),
  daysUntilDue: z.number().int(),
});

// Common validation schemas for API
export const SubscriptionIdParamSchema = z.object({
  id: z.string().min(1, 'Subscription ID is required'),
});

export const SubscriptionListQuerySchema = z.object({
  status: SubscriptionStatusSchema.optional(),
  categoryId: z.string().optional(),
  paymentMethodId: z.string().optional(),
});

// Type exports for TypeScript inference
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscriptionRequest = z.infer<typeof UpdateSubscriptionSchema>;
export type CancelSubscriptionRequest = z.infer<typeof CancelSubscriptionSchema>;
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;
export type SubscriptionOverviewResponse = z.infer<typeof SubscriptionOverviewResponseSchema>;
export type UpcomingPaymentResponse = z.infer<typeof UpcomingPaymentResponseSchema>;
export type SubscriptionIdParam = z.infer<typeof SubscriptionIdParamSchema>;
export type SubscriptionListQuery = z.infer<typeof SubscriptionListQuerySchema>; 