import { z } from 'zod';

// Payment method type schema
const PaymentMethodTypeSchema = z.enum(['cash', 'bank', 'credit_card'], {
  errorMap: () => ({ message: 'Type must be cash, bank, or credit_card' }),
});

// Request validation schemas
export const CreatePaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  type: PaymentMethodTypeSchema,
});

export const UpdatePaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100, 'Name cannot exceed 100 characters').optional(),
});

// Response schemas
export const PaymentMethodResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: PaymentMethodTypeSchema,
  isActive: z.boolean(),
  supportsInstallments: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Common validation schemas for API
export const PaymentMethodIdParamSchema = z.object({
  id: z.string().min(1, 'Payment method ID is required'),
});

export const PaymentMethodListQuerySchema = z.object({
  type: PaymentMethodTypeSchema.optional(),
  active: z.coerce.boolean().optional(),
  supportsInstallments: z.coerce.boolean().optional(),
});

// Type exports for TypeScript inference
export type CreatePaymentMethodRequest = z.infer<typeof CreatePaymentMethodSchema>;
export type UpdatePaymentMethodRequest = z.infer<typeof UpdatePaymentMethodSchema>;
export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>;
export type PaymentMethodIdParam = z.infer<typeof PaymentMethodIdParamSchema>;
export type PaymentMethodListQuery = z.infer<typeof PaymentMethodListQuerySchema>; 