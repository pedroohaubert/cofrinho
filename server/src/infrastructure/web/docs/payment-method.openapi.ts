import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  CreatePaymentMethodSchema,
  UpdatePaymentMethodSchema,
  PaymentMethodResponseSchema,
  PaymentMethodIdParamSchema,
  PaymentMethodListQuerySchema
} from '@/application/validation/payment-method.schema.js';

const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    timestamp: z.string(),
    path: z.string().optional(),
    details: z.array(z.any()).optional()
  })
});

// GET /payment-methods
export const listPaymentMethodsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Payment Methods'],
  summary: 'List payment methods',
  description: 'Retrieve all payment methods with optional filtering',
  request: {
    query: PaymentMethodListQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(PaymentMethodResponseSchema)
        }
      },
      description: 'List of payment methods'
    }
  }
});

// POST /payment-methods
export const createPaymentMethodRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Payment Methods'],
  summary: 'Create payment method',
  description: 'Create a new payment method',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePaymentMethodSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: PaymentMethodResponseSchema
        }
      },
      description: 'Payment method created successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Validation error'
    }
  }
});

// GET /payment-methods/:id
export const getPaymentMethodRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Payment Methods'],
  summary: 'Get payment method',
  description: 'Retrieve a specific payment method by ID',
  request: {
    params: PaymentMethodIdParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PaymentMethodResponseSchema
        }
      },
      description: 'Payment method details'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Payment method not found'
    }
  }
});

// PUT /payment-methods/:id
export const updatePaymentMethodRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Payment Methods'],
  summary: 'Update payment method',
  description: 'Update an existing payment method',
  request: {
    params: PaymentMethodIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdatePaymentMethodSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PaymentMethodResponseSchema
        }
      },
      description: 'Payment method updated successfully'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Validation error'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Payment method not found'
    }
  }
});

// DELETE /payment-methods/:id
export const deletePaymentMethodRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Payment Methods'],
  summary: 'Delete payment method',
  description: 'Delete a payment method',
  request: {
    params: PaymentMethodIdParamSchema
  },
  responses: {
    204: {
      description: 'Payment method deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Payment method not found'
    }
  }
}); 