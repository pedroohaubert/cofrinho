import { PaymentMethodController } from '@/infrastructure/web/controllers/payment-method.controller.js';
import { createOpenAPIApp } from '@/infrastructure/web/docs/openapi.config.js';
import {
  listPaymentMethodsRoute,
  createPaymentMethodRoute,
  getPaymentMethodRoute,
  updatePaymentMethodRoute,
  deletePaymentMethodRoute
} from '@/infrastructure/web/docs/payment-method.openapi.js';

export function createPaymentMethodRoutes(paymentMethodController: PaymentMethodController) {
  const router = createOpenAPIApp();

  // GET /payment-methods - List active payment methods
  router.openapi(listPaymentMethodsRoute, async (c) => {
    return paymentMethodController.findAll(c);
  });

  // POST /payment-methods - Create payment method
  router.openapi(createPaymentMethodRoute, async (c) => {
    return paymentMethodController.create(c);
  });

  // GET /payment-methods/:id - Get payment method by ID
  router.openapi(getPaymentMethodRoute, async (c) => {
    return paymentMethodController.findById(c);
  });

  // PUT /payment-methods/:id - Update payment method
  router.openapi(updatePaymentMethodRoute, async (c) => {
    return paymentMethodController.update(c);
  });

  // DELETE /payment-methods/:id - Delete payment method (deactivate)
  router.openapi(deletePaymentMethodRoute, async (c) => {
    return paymentMethodController.delete(c);
  });

  return router;
} 