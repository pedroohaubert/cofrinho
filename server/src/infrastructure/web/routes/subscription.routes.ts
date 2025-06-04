import { SubscriptionController } from '@/infrastructure/web/controllers/subscription.controller.js';
import { createOpenAPIApp } from '@/infrastructure/web/docs/openapi.config.js';
import {
  listSubscriptionsRoute,
  createSubscriptionRoute,
  getSubscriptionRoute,
  updateSubscriptionRoute,
  deleteSubscriptionRoute
} from '@/infrastructure/web/docs/subscription.openapi.js';
import { validateBody, validateParam, idParamSchema } from '@/infrastructure/web/middleware/validation.middleware.js';
import { CancelSubscriptionSchema } from '@/application/validation/subscription.schema.js';

export function createSubscriptionRoutes(subscriptionController: SubscriptionController) {
  const router = createOpenAPIApp();

  // GET /subscriptions - List active subscriptions
  router.openapi(listSubscriptionsRoute, async (c) => {
    return subscriptionController.findAll(c);
  });

  // POST /subscriptions - Create subscription
  router.openapi(createSubscriptionRoute, async (c) => {
    return subscriptionController.create(c);
  });

  // GET /subscriptions/:id - Get subscription by ID
  router.openapi(getSubscriptionRoute, async (c) => {
    return subscriptionController.findById(c);
  });

  // PUT /subscriptions/:id - Update subscription
  router.openapi(updateSubscriptionRoute, async (c) => {
    return subscriptionController.update(c);
  });

  // DELETE /subscriptions/:id - Delete subscription
  router.openapi(deleteSubscriptionRoute, async (c) => {
    return subscriptionController.delete(c);
  });

  // POST /subscriptions/:id/cancel - Cancel subscription
  router.post('/:id/cancel', validateParam(idParamSchema), validateBody(CancelSubscriptionSchema), async (c) => {
    return subscriptionController.cancel(c);
  });

  return router;
} 