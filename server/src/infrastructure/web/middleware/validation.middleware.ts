import { Context, Next } from 'hono';
import { validator } from 'hono/validator';
import { z } from 'zod';

// Common validation schemas
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const paginationQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
}).refine(data => data.page > 0, { message: 'Page must be greater than 0' })
  .refine(data => data.limit > 0 && data.limit <= 100, { message: 'Limit must be between 1 and 100' });

// Generic validation helper
export const validateBody = <T extends z.ZodSchema>(schema: T) => {
  return validator('json', (value, c) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      return c.json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: parsed.error.errors,
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, 400);
    }
    return parsed.data;
  });
};

export const validateQuery = <T extends z.ZodSchema>(schema: T) => {
  return validator('query', (value, c) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      return c.json({
        error: {
          message: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: parsed.error.errors,
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, 400);
    }
    return parsed.data;
  });
};

export const validateParam = <T extends z.ZodSchema>(schema: T) => {
  return validator('param', (value, c) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      return c.json({
        error: {
          message: 'Invalid path parameters',
          code: 'VALIDATION_ERROR',
          details: parsed.error.errors,
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, 400);
    }
    return parsed.data;
  });
}; 