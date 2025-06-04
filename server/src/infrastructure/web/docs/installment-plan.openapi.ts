import { z } from 'zod';
import { createBasicCRUDRoutes } from './generate-all-docs';
import {
  CreateInstallmentPlanSchema,
  UpdateInstallmentPlanSchema,
  InstallmentPlanResponseSchema
} from '../../../application/validation/installment-plan.schema';

// Generate basic CRUD routes for installment plans
export const installmentPlanRoutes = createBasicCRUDRoutes('installment-plans', {
  list: z.array(InstallmentPlanResponseSchema),
  create: CreateInstallmentPlanSchema,
  update: UpdateInstallmentPlanSchema,
  response: InstallmentPlanResponseSchema,
}, 'Installment Plans');

// Export individual routes for easy use
export const listInstallmentPlansRoute = installmentPlanRoutes.list;
export const createInstallmentPlanRoute = installmentPlanRoutes.create;
export const getInstallmentPlanRoute = installmentPlanRoutes.get;
export const updateInstallmentPlanRoute = installmentPlanRoutes.update;
export const deleteInstallmentPlanRoute = installmentPlanRoutes.delete; 