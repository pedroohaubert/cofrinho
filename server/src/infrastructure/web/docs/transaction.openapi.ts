import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ListTransactionsQuerySchema,
  TransactionResponseSchema,
  PaginatedTransactionsResponseSchema,
  TransactionIdParamSchema
} from '@/application/validation/transaction.schema.js';

const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    timestamp: z.string(),
    path: z.string().optional(),
    details: z.array(z.any()).optional()
  })
});

// GET /transactions
export const listTransactionsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Transactions'],
  summary: 'List transactions',
  description: 'Retrieve a paginated list of transactions with optional filtering',
  request: {
    query: ListTransactionsQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PaginatedTransactionsResponseSchema
        }
      },
      description: 'List of transactions with pagination'
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

// POST /transactions
export const createTransactionRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Transactions'],
  summary: 'Create transaction',
  description: 'Create a new transaction',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateTransactionSchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: TransactionResponseSchema
        }
      },
      description: 'Transaction created successfully'
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

// GET /transactions/:id
export const getTransactionRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Transactions'],
  summary: 'Get transaction',
  description: 'Retrieve a specific transaction by ID',
  request: {
    params: TransactionIdParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TransactionResponseSchema
        }
      },
      description: 'Transaction details'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Transaction not found'
    }
  }
});

// PUT /transactions/:id
export const updateTransactionRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Transactions'],
  summary: 'Update transaction',
  description: 'Update an existing transaction',
  request: {
    params: TransactionIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateTransactionSchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TransactionResponseSchema
        }
      },
      description: 'Transaction updated successfully'
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
      description: 'Transaction not found'
    }
  }
});

// DELETE /transactions/:id
export const deleteTransactionRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Transactions'],
  summary: 'Delete transaction',
  description: 'Delete a transaction',
  request: {
    params: TransactionIdParamSchema
  },
  responses: {
    204: {
      description: 'Transaction deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Transaction not found'
    }
  }
}); 