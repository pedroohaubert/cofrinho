/**
 * This file demonstrates how to quickly generate OpenAPI definitions for all your endpoints.
 * Since you already have comprehensive Zod schemas, this pattern can be repeated for all entities.
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

// Example of how to create a reusable error schema
export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(), 
    timestamp: z.string(),
    path: z.string().optional(),
    details: z.array(z.any()).optional()
  })
});

// Standard ID parameter schema for OpenAPI
const IdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } })
});

// Simplified CRUD route generator for basic endpoints
export const createBasicCRUDRoutes = (entity: string, schemas: {
  list: z.ZodSchema,
  create: z.ZodSchema,
  update: z.ZodSchema,
  response: z.ZodSchema
}, customTag?: string) => {
  const tag = customTag || entity.charAt(0).toUpperCase() + entity.slice(1);
  
  return {
    list: createRoute({
      method: 'get',
      path: `/`,
      tags: [tag],
      summary: `List ${entity}`,
      description: `Retrieve all ${entity}`,
      responses: {
        200: {
          content: {
            'application/json': {
              schema: schemas.list
            }
          },
          description: `List of ${entity}`
        }
      }
    }),
    
    create: createRoute({
      method: 'post', 
      path: `/`,
      tags: [tag],
      summary: `Create ${entity.slice(0, -1)}`,
      description: `Create a new ${entity.slice(0, -1)}`,
      request: {
        body: {
          content: {
            'application/json': {
              schema: schemas.create
            }
          }
        }
      },
      responses: {
        201: {
          content: {
            'application/json': {
              schema: schemas.response
            }
          },
          description: `${entity.slice(0, -1)} created successfully`
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
    }),
    
    get: createRoute({
      method: 'get',
      path: `/{id}`,
      tags: [tag],
      summary: `Get ${entity.slice(0, -1)}`,
      description: `Retrieve a specific ${entity.slice(0, -1)} by ID`,
      request: {
        params: IdParamSchema
      },
      responses: {
        200: {
          content: {
            'application/json': {
              schema: schemas.response
            }
          },
          description: `${entity.slice(0, -1)} details`
        },
        404: {
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          },
          description: `${entity.slice(0, -1)} not found`
        }
      }
    }),
    
    update: createRoute({
      method: 'put',
      path: `/{id}`,
      tags: [tag],
      summary: `Update ${entity.slice(0, -1)}`,
      description: `Update an existing ${entity.slice(0, -1)}`,
      request: {
        params: IdParamSchema,
        body: {
          content: {
            'application/json': {
              schema: schemas.update
            }
          }
        }
      },
      responses: {
        200: {
          content: {
            'application/json': {
              schema: schemas.response
            }
          },
          description: `${entity.slice(0, -1)} updated successfully`
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
          description: `${entity.slice(0, -1)} not found`
        }
      }
    }),
    
    delete: createRoute({
      method: 'delete',
      path: `/{id}`,
      tags: [tag],
      summary: `Delete ${entity.slice(0, -1)}`,
      description: `Delete a ${entity.slice(0, -1)}`,
      request: {
        params: IdParamSchema
      },
      responses: {
        204: {
          description: `${entity.slice(0, -1)} deleted successfully`
        },
        404: {
          content: {
            'application/json': {
              schema: ErrorResponseSchema
            }
          },
          description: `${entity.slice(0, -1)} not found`
        }
      }
    })
  };
};

/**
 * For endpoints that need query parameters, create them individually:
 * 
 * export const listCategoriesRoute = createRoute({
 *   method: 'get',
 *   path: '/categories',
 *   tags: ['Categories'],
 *   summary: 'List categories',
 *   request: {
 *     query: CategoryListQuerySchema
 *   },
 *   responses: {
 *     200: {
 *       content: {
 *         'application/json': {
 *           schema: z.array(CategoryResponseSchema)
 *         }
 *       },
 *       description: 'List of categories'
 *     }
 *   }
 * });
 * 
 * Usage example for Categories:
 * 
 * import { 
 *   CreateCategorySchema,
 *   UpdateCategorySchema,
 *   CategoryResponseSchema,
 * } from '../../../application/validation/category.schema';
 * 
 * export const categoryRoutes = createBasicCRUDRoutes('categories', {
 *   list: z.array(CategoryResponseSchema),
 *   create: CreateCategorySchema,
 *   update: UpdateCategorySchema,
 *   response: CategoryResponseSchema,
 * });
 * 
 * Then use: categoryRoutes.list, categoryRoutes.create, etc.
 */ 