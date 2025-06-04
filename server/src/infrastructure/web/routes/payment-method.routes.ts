import { PaymentMethodController } from '../controllers/payment-method.controller';
import { createOpenAPIApp } from '../docs/openapi.config';
import {
  listPaymentMethodsRoute,
  createPaymentMethodRoute,
  getPaymentMethodRoute,
  updatePaymentMethodRoute,
  deletePaymentMethodRoute
} from '../docs/payment-method.openapi';

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