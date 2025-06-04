import { OpenAPIHono } from '@hono/zod-openapi';

// Route imports
import { createTransactionRoutes } from './transaction.routes';
import { createCategoryRoutes } from './category.routes';
import { createPaymentMethodRoutes } from './payment-method.routes';
import { createSubscriptionRoutes } from './subscription.routes';
import { createSavingsBucketRoutes } from './savings-bucket.routes';
import { createInstallmentPlanRoutes } from './installment-plan.routes';
import { createReportRoutes } from './report.routes';

// Controller imports
import { TransactionController } from '../controllers/transaction.controller';
import { CategoryController } from '../controllers/category.controller';
import { PaymentMethodController } from '../controllers/payment-method.controller';
import { SubscriptionController } from '../controllers/subscription.controller';
import { SavingsBucketController } from '../controllers/savings-bucket.controller';
import { InstallmentPlanController } from '../controllers/installment-plan.controller';
import { ReportController } from '../controllers/report.controller';

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