import { SavingsBucketController } from '@/infrastructure/web/controllers/savings-bucket.controller.js';
import { createOpenAPIApp } from '@/infrastructure/web/docs/openapi.config.js';
import {
  listSavingsBucketsRoute,
  createSavingsBucketRoute,
  getSavingsBucketRoute,
  updateSavingsBucketRoute,
  deleteSavingsBucketRoute,
  transferToBucketRoute
} from '@/infrastructure/web/docs/savings-bucket.openapi.js';
import { validateBody, validateParam, idParamSchema } from '@/infrastructure/web/middleware/validation.middleware.js';
import { TransferToBucketSchema } from '@/application/validation/savings-bucket.schema.js';

export function createSavingsBucketRoutes(savingsBucketController: SavingsBucketController) {
  const router = createOpenAPIApp();

  // GET /buckets - List active savings buckets
  router.openapi(listSavingsBucketsRoute, async (c) => {
    return savingsBucketController.findAll(c);
  });

  // POST /buckets - Create savings bucket
  router.openapi(createSavingsBucketRoute, async (c) => {
    return savingsBucketController.create(c);
  });

  // GET /buckets/:id - Get savings bucket by ID
  router.openapi(getSavingsBucketRoute, async (c) => {
    return savingsBucketController.findById(c);
  });

  // PUT /buckets/:id - Update savings bucket
  router.openapi(updateSavingsBucketRoute, async (c) => {
    return savingsBucketController.update(c);
  });

  // DELETE /buckets/:id - Delete savings bucket (deactivate)
  router.openapi(deleteSavingsBucketRoute, async (c) => {
    return savingsBucketController.delete(c);
  });

  // PUT /buckets/:id/transfer - Transfer money to/from bucket
  router.openapi(transferToBucketRoute, async (c) => {
    return savingsBucketController.transfer(c);
  });

  return router;
} 