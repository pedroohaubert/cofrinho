import { z } from 'zod';

// Category type schema
const CategoryTypeSchema = z.enum(['income', 'expense', 'both'], {
  errorMap: () => ({ message: 'Type must be income, expense, or both' }),
});

// Request validation schemas
export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  type: CategoryTypeSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code (e.g., #FF5733)').optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(100, 'Name cannot exceed 100 characters').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code (e.g., #FF5733)').nullable().optional(),
});

// Response schemas
export const CategoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: CategoryTypeSchema,
  color: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Common validation schemas for API
export const CategoryIdParamSchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
});

export const CategoryListQuerySchema = z.object({
  type: CategoryTypeSchema.optional(),
  active: z.coerce.boolean().optional(),
});

// Type exports for TypeScript inference
export type CreateCategoryRequest = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof UpdateCategorySchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoryIdParam = z.infer<typeof CategoryIdParamSchema>;
export type CategoryListQuery = z.infer<typeof CategoryListQuerySchema>; 