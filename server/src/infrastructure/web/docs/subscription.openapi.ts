import { z } from 'zod';
import { createBasicCRUDRoutes } from '@/infrastructure/web/docs/generate-all-docs.js';
import {
  CreateSubscriptionSchema,
  UpdateSubscriptionSchema,
  SubscriptionResponseSchema
} from '@/application/validation/subscription.schema.js';

// Generate basic CRUD routes for subscriptions
export const subscriptionRoutes = createBasicCRUDRoutes('subscriptions', {
  list: z.array(SubscriptionResponseSchema),
  create: CreateSubscriptionSchema,
  update: UpdateSubscriptionSchema,
  response: SubscriptionResponseSchema,
}, 'Subscriptions');

// Export individual routes for easy use
export const listSubscriptionsRoute = subscriptionRoutes.list;
export const createSubscriptionRoute = subscriptionRoutes.create;
export const getSubscriptionRoute = subscriptionRoutes.get;
export const updateSubscriptionRoute = subscriptionRoutes.update;
export const deleteSubscriptionRoute = subscriptionRoutes.delete; 