import { serve } from 'bun';
import 'dotenv/config';
import { OpenAPIHono } from '@hono/zod-openapi';

// Infrastructure imports
import { checkDatabaseConnection, closeDatabaseConnection } from '@/infrastructure/database/connection.js';
import { corsMiddleware } from '@/infrastructure/web/middleware/cors.middleware.js';
import { loggerMiddleware } from '@/infrastructure/web/middleware/logger.middleware.js';
import { errorHandlerMiddleware } from '@/infrastructure/web/middleware/error-handler.middleware.js';

// Documentation
import { createDocsRoutes } from '@/infrastructure/web/docs/docs.routes.js';
import { openAPIConfig } from '@/infrastructure/web/docs/openapi.config.js';

// Repository implementations
import { PostgreSQLTransactionRepository } from '@/infrastructure/database/repositories/postgresql-transaction.repository.js';
import { PostgreSQLCategoryRepository } from '@/infrastructure/database/repositories/postgresql-category.repository.js';
import { PostgreSQLPaymentMethodRepository } from '@/infrastructure/database/repositories/postgresql-payment-method.repository.js';
import { PostgreSQLInstallmentPlanRepository } from '@/infrastructure/database/repositories/postgresql-installment-plan.repository.js';
import { PostgreSQLSubscriptionRepository } from '@/infrastructure/database/repositories/postgresql-subscription.repository.js';
import { PostgreSQLSavingsBucketRepository } from '@/infrastructure/database/repositories/postgresql-savings-bucket.repository.js';
import { PostgreSQLBucketTransferRepository } from '@/infrastructure/database/repositories/postgresql-bucket-transfer.repository.js';

// Domain services
import { TransactionService } from '@/domain/services/transaction-service.js';
import { InstallmentService } from '@/domain/services/installment-service.js';
import { SubscriptionService } from '@/domain/services/subscription-service.js';
import { ReportingService } from '@/domain/services/reporting-service.js';
import { SavingsBucketService } from '@/domain/services/savings-bucket-service.js';

// Use cases
import { CreateTransactionUseCase } from '@/application/use-cases/transaction/create-transaction.use-case.js';
import { UpdateTransactionUseCase } from '@/application/use-cases/transaction/update-transaction.use-case.js';
import { DeleteTransactionUseCase } from '@/application/use-cases/transaction/delete-transaction.use-case.js';
import { ListTransactionsUseCase } from '@/application/use-cases/transaction/list-transactions.use-case.js';
import { CreateInstallmentPlanUseCase } from '@/application/use-cases/installment/create-installment-plan.use-case.js';
import { CreateSubscriptionUseCase } from '@/application/use-cases/subscription/create-subscription.use-case.js';
import { CancelSubscriptionUseCase } from '@/application/use-cases/subscription/cancel-subscription.use-case.js';
import { GenerateMonthlyReportUseCase } from '@/application/use-cases/report/generate-monthly-report.use-case.js';
import { GenerateYearlyReportUseCase } from '@/application/use-cases/report/generate-yearly-report.use-case.js';
import { CreateSavingsBucketUseCase } from '@/application/use-cases/savings-bucket/create-savings-bucket.use-case.js';
import { TransferToBucketUseCase } from '@/application/use-cases/savings-bucket/transfer-to-bucket.use-case.js';

// Controllers
import { TransactionController } from '@/infrastructure/web/controllers/transaction.controller.js';
import { CategoryController } from '@/infrastructure/web/controllers/category.controller.js';
import { PaymentMethodController } from '@/infrastructure/web/controllers/payment-method.controller.js';
import { SubscriptionController } from '@/infrastructure/web/controllers/subscription.controller.js';
import { SavingsBucketController } from '@/infrastructure/web/controllers/savings-bucket.controller.js';
import { InstallmentPlanController } from '@/infrastructure/web/controllers/installment-plan.controller.js';
import { ReportController } from '@/infrastructure/web/controllers/report.controller.js';

// Routes
import { createApiRoutes, RouteControllers } from '@/infrastructure/web/routes/index.js';

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