import { CategoryController } from '../controllers/category.controller';
import { createOpenAPIApp } from '../docs/openapi.config';
import {
  listCategoriesRoute,
  createCategoryRoute,
  getCategoryRoute,
  updateCategoryRoute,
  deleteCategoryRoute
} from '@/infrastructure/web/docs/category.openapi.js';

export function createCategoryRoutes(categoryController: CategoryController) {
  const router = createOpenAPIApp();

  // GET /categories - List active categories
  router.openapi(listCategoriesRoute, async (c) => {
    return categoryController.findAll(c);
  });

  // POST /categories - Create category
  router.openapi(createCategoryRoute, async (c) => {
    return categoryController.create(c);
  });

  // GET /categories/:id - Get category by ID
  router.openapi(getCategoryRoute, async (c) => {
    return categoryController.findById(c);
  });

  // PUT /categories/:id - Update category
  router.openapi(updateCategoryRoute, async (c) => {
    return categoryController.update(c);
  });

  // DELETE /categories/:id - Delete category (deactivate)
  router.openapi(deleteCategoryRoute, async (c) => {
    return categoryController.delete(c);
  });

  return router;
} 