import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}

export const errorHandlerMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error('🚨 Unhandled error:', error);
    
    // Handle HTTPException from Hono
    if (error instanceof HTTPException) {
      const response: ErrorResponse = {
        error: {
          message: error.message,
          code: 'HTTP_EXCEPTION',
          timestamp: new Date().toISOString(),
          path: c.req.path,
        },
      };
      
      return c.json(response, error.status);
    }
    
    // Handle validation errors (typically from Zod)
    if (error instanceof Error && error.name === 'ZodError') {
      const response: ErrorResponse = {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: (error as any).errors || error.message,
          timestamp: new Date().toISOString(),
          path: c.req.path,
        },
      };
      
      return c.json(response, 400);
    }
    
    // Handle domain/business logic errors
    if (error instanceof Error) {
      // Check if it's a domain validation error
      if (error.message.includes('cannot be') || 
          error.message.includes('is required') ||
          error.message.includes('must be')) {
        const response: ErrorResponse = {
          error: {
            message: error.message,
            code: 'BUSINESS_RULE_VIOLATION',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          },
        };
        
        return c.json(response, 400);
      }
      
      // Check if it's a not found error
      if (error.message.includes('not found') || 
          error.message.includes('does not exist')) {
        const response: ErrorResponse = {
          error: {
            message: error.message,
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          },
        };
        
        return c.json(response, 404);
      }
    }
    
    // Handle database errors
    if (error instanceof Error && (
      error.message.includes('duplicate key') ||
      error.message.includes('violates unique constraint')
    )) {
      const response: ErrorResponse = {
        error: {
          message: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE',
          timestamp: new Date().toISOString(),
          path: c.req.path,
        },
      };
      
      return c.json(response, 409);
    }
    
    // Generic server error
    const response: ErrorResponse = {
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.stack : error 
          : undefined,
        timestamp: new Date().toISOString(),
        path: c.req.path,
      },
    };
    
    return c.json(response, 500);
  }
}; 