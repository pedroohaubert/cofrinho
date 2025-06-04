import { OpenAPIHono } from '@hono/zod-openapi';

export const createOpenAPIApp = () => {
  return new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: result.error.issues,
              timestamp: new Date().toISOString(),
            }
          },
          400
        );
      }
    }
  });
};

export const openAPIConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Cofrinho API',
    description: 'Personal expense tracker and financial management API',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'pedro@cofrinho.app'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Transactions',
      description: 'Transaction management operations'
    },
    {
      name: 'Categories',
      description: 'Category management operations'
    },
    {
      name: 'Payment Methods',
      description: 'Payment method management operations'
    },
    {
      name: 'Installment Plans',
      description: 'Installment plan management operations'
    },
    {
      name: 'Subscriptions',
      description: 'Subscription management operations'
    },
    {
      name: 'Savings Buckets',
      description: 'Savings bucket management operations'
    },
    {
      name: 'Reports',
      description: 'Financial reporting operations'
    }
  ],
  components: {
    schemas: {},
    responses: {
      ValidationError: {
        description: 'Validation error response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    code: { type: 'string' },
                    details: { type: 'array', items: { type: 'object' } },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    code: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    path: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    code: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}; 