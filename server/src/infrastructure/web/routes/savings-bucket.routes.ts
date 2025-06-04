import { SavingsBucketController } from '../controllers/savings-bucket.controller';
import { createOpenAPIApp } from '../docs/openapi.config';
import {
  listSavingsBucketsRoute,
  createSavingsBucketRoute,
  getSavingsBucketRoute,
  updateSavingsBucketRoute,
  deleteSavingsBucketRoute,
  transferToBucketRoute
} from '../docs/savings-bucket.openapi';
import { validateBody, validateParam, idParamSchema } from '../middleware/validation.middleware';
import { TransferToBucketSchema } from '../../../application/validation/savings-bucket.schema';

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