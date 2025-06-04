import { OpenAPIHono } from '@hono/zod-openapi';

// Route imports
import { createTransactionRoutes } from '@/infrastructure/web/routes/transaction.routes.js';
import { createCategoryRoutes } from '@/infrastructure/web/routes/category.routes.js';
import { createPaymentMethodRoutes } from '@/infrastructure/web/routes/payment-method.routes.js';
import { createSubscriptionRoutes } from '@/infrastructure/web/routes/subscription.routes.js';
import { createSavingsBucketRoutes } from '@/infrastructure/web/routes/savings-bucket.routes.js';
import { createInstallmentPlanRoutes } from '@/infrastructure/web/routes/installment-plan.routes.js';
import { createReportRoutes } from '@/infrastructure/web/routes/report.routes.js';

// Controller imports
import { TransactionController } from '@/infrastructure/web/controllers/transaction.controller.js';
import { CategoryController } from '@/infrastructure/web/controllers/category.controller.js';
import { PaymentMethodController } from '@/infrastructure/web/controllers/payment-method.controller.js';
import { SubscriptionController } from '@/infrastructure/web/controllers/subscription.controller.js';
import { SavingsBucketController } from '@/infrastructure/web/controllers/savings-bucket.controller.js';
import { InstallmentPlanController } from '@/infrastructure/web/controllers/installment-plan.controller.js';
import { ReportController } from '@/infrastructure/web/controllers/report.controller.js';

export interface RouteControllers {
  transactionController: TransactionController;
  categoryController: CategoryController;
  paymentMethodController: PaymentMethodController;
  subscriptionController: SubscriptionController;
  savingsBucketController: SavingsBucketController;
  installmentPlanController: InstallmentPlanController;
  reportController: ReportController;
}

export function createApiRoutes(controllers: RouteControllers) {
  const api = new OpenAPIHono();

  // Mount all route modules
  api.route('/transactions', createTransactionRoutes(controllers.transactionController));
  api.route('/categories', createCategoryRoutes(controllers.categoryController));
  api.route('/payment-methods', createPaymentMethodRoutes(controllers.paymentMethodController));
  api.route('/subscriptions', createSubscriptionRoutes(controllers.subscriptionController));
  api.route('/buckets', createSavingsBucketRoutes(controllers.savingsBucketController));
  api.route('/installment-plans', createInstallmentPlanRoutes(controllers.installmentPlanController));
  api.route('/reports', createReportRoutes(controllers.reportController));

  return api;
} 