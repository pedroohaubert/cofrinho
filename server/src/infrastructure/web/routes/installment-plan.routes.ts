import { InstallmentPlanController } from '@/infrastructure/web/controllers/installment-plan.controller.js';
import { createOpenAPIApp } from '@/infrastructure/web/docs/openapi.config.js';
import {
  listInstallmentPlansRoute,
  createInstallmentPlanRoute,
  getInstallmentPlanRoute,
  updateInstallmentPlanRoute,
  deleteInstallmentPlanRoute
} from '@/infrastructure/web/docs/installment-plan.openapi.js';

export function createInstallmentPlanRoutes(installmentPlanController: InstallmentPlanController) {
  const router = createOpenAPIApp();

  // GET /installment-plans - List active installment plans
  router.openapi(listInstallmentPlansRoute, async (c) => {
    return installmentPlanController.findAll(c);
  });

  // POST /installment-plans - Create installment plan
  router.openapi(createInstallmentPlanRoute, async (c) => {
    return installmentPlanController.create(c);
  });

  // GET /installment-plans/:id - Get installment plan by ID
  router.openapi(getInstallmentPlanRoute, async (c) => {
    return installmentPlanController.findById(c);
  });

  // PUT /installment-plans/:id - Update installment plan
  router.openapi(updateInstallmentPlanRoute, async (c) => {
    return installmentPlanController.update(c);
  });

  // DELETE /installment-plans/:id - Cancel installment plan
  router.openapi(deleteInstallmentPlanRoute, async (c) => {
    return installmentPlanController.delete(c);
  });

  return router;
} 