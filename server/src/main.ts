import { serve } from 'bun';
import 'dotenv/config';
import { OpenAPIHono } from '@hono/zod-openapi';

// Infrastructure imports
import { checkDatabaseConnection, closeDatabaseConnection } from './infrastructure/database/connection';
import { corsMiddleware } from './infrastructure/web/middleware/cors.middleware';
import { loggerMiddleware } from './infrastructure/web/middleware/logger.middleware';
import { errorHandlerMiddleware } from './infrastructure/web/middleware/error-handler.middleware';

// Documentation
import { createDocsRoutes } from './infrastructure/web/docs/docs.routes';
import { openAPIConfig } from './infrastructure/web/docs/openapi.config';

// Repository implementations
import { PostgreSQLTransactionRepository } from './infrastructure/database/repositories/postgresql-transaction.repository';
import { PostgreSQLCategoryRepository } from './infrastructure/database/repositories/postgresql-category.repository';
import { PostgreSQLPaymentMethodRepository } from './infrastructure/database/repositories/postgresql-payment-method.repository';
import { PostgreSQLInstallmentPlanRepository } from './infrastructure/database/repositories/postgresql-installment-plan.repository';
import { PostgreSQLSubscriptionRepository } from './infrastructure/database/repositories/postgresql-subscription.repository';
import { PostgreSQLSavingsBucketRepository } from './infrastructure/database/repositories/postgresql-savings-bucket.repository';
import { PostgreSQLBucketTransferRepository } from './infrastructure/database/repositories/postgresql-bucket-transfer.repository';

// Domain services
import { TransactionService } from './domain/services/transaction-service';
import { InstallmentService } from './domain/services/installment-service';
import { SubscriptionService } from './domain/services/subscription-service';
import { ReportingService } from './domain/services/reporting-service';
import { SavingsBucketService } from './domain/services/savings-bucket-service';

// Use cases
import { CreateTransactionUseCase } from './application/use-cases/transaction/create-transaction.use-case';
import { UpdateTransactionUseCase } from './application/use-cases/transaction/update-transaction.use-case';
import { DeleteTransactionUseCase } from './application/use-cases/transaction/delete-transaction.use-case';
import { ListTransactionsUseCase } from './application/use-cases/transaction/list-transactions.use-case';
import { CreateInstallmentPlanUseCase } from './application/use-cases/installment/create-installment-plan.use-case';
import { CreateSubscriptionUseCase } from './application/use-cases/subscription/create-subscription.use-case';
import { CancelSubscriptionUseCase } from './application/use-cases/subscription/cancel-subscription.use-case';
import { GenerateMonthlyReportUseCase } from './application/use-cases/report/generate-monthly-report.use-case';
import { GenerateYearlyReportUseCase } from './application/use-cases/report/generate-yearly-report.use-case';
import { CreateSavingsBucketUseCase } from './application/use-cases/savings-bucket/create-savings-bucket.use-case';
import { TransferToBucketUseCase } from './application/use-cases/savings-bucket/transfer-to-bucket.use-case';

// Controllers
import { TransactionController } from './infrastructure/web/controllers/transaction.controller';
import { CategoryController } from './infrastructure/web/controllers/category.controller';
import { PaymentMethodController } from './infrastructure/web/controllers/payment-method.controller';
import { SubscriptionController } from './infrastructure/web/controllers/subscription.controller';
import { SavingsBucketController } from './infrastructure/web/controllers/savings-bucket.controller';
import { InstallmentPlanController } from './infrastructure/web/controllers/installment-plan.controller';
import { ReportController } from './infrastructure/web/controllers/report.controller';

// Routes
import { createApiRoutes, RouteControllers } from './infrastructure/web/routes';

// Initialize application with OpenAPI support
const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: result.error.issues,
            timestamp: new Date().toISOString(),
          }
        },
        400
      );
    }
  }
});

// Global middleware
app.use('*', errorHandlerMiddleware);
app.use('*', corsMiddleware);
app.use('*', loggerMiddleware);

// Health check endpoint
app.get('/health', async (c) => {
  const dbConnected = await checkDatabaseConnection();
  
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
  });
});

// Initialize repositories
const transactionRepository = new PostgreSQLTransactionRepository();
const categoryRepository = new PostgreSQLCategoryRepository();
const paymentMethodRepository = new PostgreSQLPaymentMethodRepository();
const installmentPlanRepository = new PostgreSQLInstallmentPlanRepository();
const subscriptionRepository = new PostgreSQLSubscriptionRepository();
const savingsBucketRepository = new PostgreSQLSavingsBucketRepository();
const bucketTransferRepository = new PostgreSQLBucketTransferRepository();

// Initialize domain services  
const transactionService = new TransactionService(transactionRepository, categoryRepository, paymentMethodRepository);
const installmentService = new InstallmentService(installmentPlanRepository, transactionRepository, paymentMethodRepository);
const subscriptionService = new SubscriptionService(subscriptionRepository, transactionRepository);
const reportingService = new ReportingService(transactionRepository, categoryRepository, paymentMethodRepository, subscriptionRepository, savingsBucketRepository);
const savingsBucketService = new SavingsBucketService(savingsBucketRepository, bucketTransferRepository);

// Initialize use cases
const createTransactionUseCase = new CreateTransactionUseCase(
  transactionRepository, 
  categoryRepository,
  paymentMethodRepository,
  transactionService
);
const updateTransactionUseCase = new UpdateTransactionUseCase(transactionRepository, categoryRepository, paymentMethodRepository, transactionService);
const deleteTransactionUseCase = new DeleteTransactionUseCase(transactionRepository);
const listTransactionsUseCase = new ListTransactionsUseCase(transactionRepository);

const createInstallmentPlanUseCase = new CreateInstallmentPlanUseCase(installmentPlanRepository, categoryRepository, paymentMethodRepository, installmentService);
const createSubscriptionUseCase = new CreateSubscriptionUseCase(subscriptionRepository, categoryRepository, paymentMethodRepository);
const cancelSubscriptionUseCase = new CancelSubscriptionUseCase(subscriptionRepository);

const generateMonthlyReportUseCase = new GenerateMonthlyReportUseCase(reportingService);
const generateYearlyReportUseCase = new GenerateYearlyReportUseCase(reportingService);

const createSavingsBucketUseCase = new CreateSavingsBucketUseCase(savingsBucketRepository);
const transferToBucketUseCase = new TransferToBucketUseCase(savingsBucketRepository, savingsBucketService);

// Initialize controllers
const controllers: RouteControllers = {
  transactionController: new TransactionController(
    createTransactionUseCase,
    updateTransactionUseCase,
    deleteTransactionUseCase,
    listTransactionsUseCase
  ),
  categoryController: new CategoryController(categoryRepository),
  paymentMethodController: new PaymentMethodController(paymentMethodRepository),
  subscriptionController: new SubscriptionController(
    createSubscriptionUseCase,
    cancelSubscriptionUseCase,
    subscriptionRepository
  ),
  savingsBucketController: new SavingsBucketController(
    createSavingsBucketUseCase,
    transferToBucketUseCase,
    savingsBucketRepository
  ),
  installmentPlanController: new InstallmentPlanController(
    createInstallmentPlanUseCase,
    installmentPlanRepository
  ),
  reportController: new ReportController(
    generateMonthlyReportUseCase,
    generateYearlyReportUseCase
  ),
};

// Mount API routes
const apiRoutes = createApiRoutes(controllers);
app.route('/api', apiRoutes);

// Add documentation routes
createDocsRoutes(app);

// 404 handler
app.notFound((c) => {
  return c.json({
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      path: c.req.path,
    }
  }, 404);
});

// Start server
const port = parseInt(process.env.PORT || '3000');

console.log('🚀 Starting Cofrinho Server...\n');

// Check database connection before starting
const dbConnected = await checkDatabaseConnection();
if (!dbConnected) {
  console.error('❌ Failed to connect to database. Exiting...');
  process.exit(1);
}

console.log('✅ Database connection established');

// Export the app for Bun to handle
export default {
  fetch: app.fetch,
  port,
};

console.log(`🌟 Server running on http://localhost:${port}`);
console.log(`📊 Health check: http://localhost:${port}/health`);
console.log(`📝 API Base: http://localhost:${port}/api`);
console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
console.log(`📄 OpenAPI Spec: http://localhost:${port}/api/openapi.json`);
console.log(`🔍 Alternative Docs: http://localhost:${port}/api/redoc`);
console.log('\n📋 Available API Endpoints:');
console.log('  • GET /api/transactions - List transactions');
console.log('  • GET /api/categories - List categories');
console.log('  • GET /api/payment-methods - List payment methods');
console.log('  • GET /api/subscriptions - List subscriptions');
console.log('  • GET /api/buckets - List savings buckets');
console.log('  • GET /api/installment-plans - List installment plans');
console.log('  • GET /api/reports/summary - Get report summary');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down server...');
  await closeDatabaseConnection();
  console.log('✅ Server shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Received SIGTERM, shutting down gracefully...');
  await closeDatabaseConnection();
  
  console.log('✅ Server shutdown complete');
  process.exit(0);
}); 