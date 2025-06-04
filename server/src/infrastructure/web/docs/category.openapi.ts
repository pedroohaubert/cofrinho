import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryResponseSchema,
  CategoryIdParamSchema,
  CategoryListQuerySchema
} from '@/application/validation/category.schema.js';

const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    timestamp: z.string(),
    path: z.string().optional(),
    details: z.array(z.any()).optional()
  })
});

// GET /categories
export const listCategoriesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Categories'],
  summary: 'List categories',
  description: 'Retrieve all categories with optional filtering',
  request: {
    query: CategoryListQuerySchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(CategoryResponseSchema)
        }
      },
      description: 'List of categories'
    }
  }
});

// POST /categories
export const createCategoryRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Categories'],
  summary: 'Create category',
  description: 'Create a new category',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCategorySchema
        }
      }
    }
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CategoryResponseSchema
        }
      },
      description: 'Category created successfully'
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

// GET /categories/:id
export const getCategoryRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Categories'],
  summary: 'Get category',
  description: 'Retrieve a specific category by ID',
  request: {
    params: CategoryIdParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CategoryResponseSchema
        }
      },
      description: 'Category details'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Category not found'
    }
  }
});

// PUT /categories/:id
export const updateCategoryRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Categories'],
  summary: 'Update category',
  description: 'Update an existing category',
  request: {
    params: CategoryIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateCategorySchema
        }
      }
    }
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CategoryResponseSchema
        }
      },
      description: 'Category updated successfully'
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
      description: 'Category not found'
    }
  }
});

// DELETE /categories/:id
export const deleteCategoryRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Categories'],
  summary: 'Delete category',
  description: 'Delete a category',
  request: {
    params: CategoryIdParamSchema
  },
  responses: {
    204: {
      description: 'Category deleted successfully'
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Category not found'
    }
  }
}); 