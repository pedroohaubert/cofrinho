import { TransactionController } from '@/infrastructure/web/controllers/transaction.controller.js';
import { createOpenAPIApp } from '@/infrastructure/web/docs/openapi.config.js';
import {
  listTransactionsRoute,
  createTransactionRoute,
  getTransactionRoute,
  updateTransactionRoute,
  deleteTransactionRoute
} from '@/infrastructure/web/docs/transaction.openapi.js';

export function createTransactionRoutes(transactionController: TransactionController) {
  const router = createOpenAPIApp();

  // GET /transactions - List transactions with filtering and pagination
  router.openapi(listTransactionsRoute, async (c) => {
    return await transactionController.findAll(c);
  });

  // POST /transactions - Create new transaction
  router.openapi(createTransactionRoute, async (c) => {
    return await transactionController.create(c);
  });

  // GET /transactions/:id - Get specific transaction
  router.openapi(getTransactionRoute, async (c) => {
    return await transactionController.findById(c);
  });

  // PUT /transactions/:id - Update transaction
  router.openapi(updateTransactionRoute, async (c) => {
    return await transactionController.update(c);
  });

  // DELETE /transactions/:id - Delete transaction
  router.openapi(deleteTransactionRoute, async (c) => {
    return await transactionController.delete(c);
  });

  // Additional routes for specific queries
  router.get('/category/:categoryId', async (c) => {
    return await transactionController.getByCategory(c);
  });

  router.get('/payment-method/:paymentMethodId', async (c) => {
    return await transactionController.getByPaymentMethod(c);
  });

  router.get('/monthly/:year/:month', async (c) => {
    return await transactionController.getMonthly(c);
  });

  router.get('/yearly/:year', async (c) => {
    return await transactionController.getYearly(c);
  });

  return router;
} 