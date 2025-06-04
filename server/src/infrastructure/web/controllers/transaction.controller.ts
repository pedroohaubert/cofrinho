import { Context } from 'hono';
import { CreateTransactionUseCase } from '@/application/use-cases/transaction/create-transaction.use-case.js';
import { UpdateTransactionUseCase } from '@/application/use-cases/transaction/update-transaction.use-case.js';
import { DeleteTransactionUseCase } from '@/application/use-cases/transaction/delete-transaction.use-case.js';
import { ListTransactionsUseCase } from '@/application/use-cases/transaction/list-transactions.use-case.js';
import { 
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ListTransactionsQuerySchema 
} from '../../../application/validation/transaction.schema';

export class TransactionController {
  constructor(
    private createTransactionUseCase: CreateTransactionUseCase,
    private updateTransactionUseCase: UpdateTransactionUseCase,
    private deleteTransactionUseCase: DeleteTransactionUseCase,
    private listTransactionsUseCase: ListTransactionsUseCase
  ) {}

  async create(c: Context) {
    const body = await c.req.json();
    
    const result = await this.createTransactionUseCase.execute(body);
    
    if (!result.success) {
      return c.json({
        error: {
          message: result.errors?.join(', ') || 'Failed to create transaction',
          code: 'CREATION_FAILED',
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, 400);
    }
    
    return c.json({
      data: result.transaction,
      message: 'Transaction created successfully'
    }, 201);
  }

  async findById(c: Context) {
    const id = c.req.param('id');
    
    // For now, return a placeholder since ListTransactionsUseCase doesn't have executeById
    try {
      return c.json({
        data: {
          id,
          date: new Date().toISOString(),
          amount: 100,
          currency: 'BRL',
          categoryId: 'cat-1',
          paymentMethodId: 'pm-1',
          type: 'expense',
          description: 'Sample transaction',
          source: 'manual',
          sourceId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(c: Context) {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const result = await this.listTransactionsUseCase.execute({
      page,
      limit,
      categoryId: c.req.query('categoryId'),
      paymentMethodId: c.req.query('paymentMethodId'),
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
      type: c.req.query('type') as 'income' | 'expense' | undefined,
      source: c.req.query('source') as 'manual' | 'installment' | 'subscription' | undefined,
      description: c.req.query('description'),
      minAmount: c.req.query('minAmount') ? parseFloat(c.req.query('minAmount')!) : undefined,
      maxAmount: c.req.query('maxAmount') ? parseFloat(c.req.query('maxAmount')!) : undefined,
    });
    
    if (!result.success) {
      return c.json({
        error: {
          message: result.errors?.join(', ') || 'Failed to fetch transactions',
          code: 'FETCH_FAILED',
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, 400);
    }
    
    // Set pagination headers
    if (result.data) {
      c.res.headers.set('X-Total-Count', result.data.totalItems.toString());
      c.res.headers.set('X-Page-Count', result.data.totalPages.toString());
    }
    
    return c.json({
      data: result.data?.items || [],
      pagination: result.data ? {
        currentPage: result.data.currentPage,
        totalPages: result.data.totalPages,
        totalItems: result.data.totalItems,
        hasNext: result.data.hasNext,
        hasPrevious: result.data.hasPrevious,
      } : undefined
    });
  }

  async update(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const result = await this.updateTransactionUseCase.execute(id, body);
    
    if (!result.success) {
      const statusCode = result.errors?.some(err => err.includes('not found')) ? 404 : 400;
      return c.json({
        error: {
          message: result.errors?.join(', ') || 'Failed to update transaction',
          code: statusCode === 404 ? 'NOT_FOUND' : 'UPDATE_FAILED',
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, statusCode);
    }
    
    return c.json({
      data: result.transaction,
      message: 'Transaction updated successfully'
    });
  }

  async delete(c: Context) {
    const id = c.req.param('id');
    
    const result = await this.deleteTransactionUseCase.execute(id);
    
    if (!result.success) {
      const statusCode = result.errors?.some(err => err.includes('not found')) ? 404 : 400;
      return c.json({
        error: {
          message: result.errors?.join(', ') || 'Failed to delete transaction',
          code: statusCode === 404 ? 'NOT_FOUND' : 'DELETE_FAILED',
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, statusCode);
    }
    
    return c.json({
      message: 'Transaction deleted successfully'
    }, 204);
  }

  async getByCategory(c: Context) {
    const categoryId = c.req.param('categoryId');
    
    try {
      return c.json({
        data: []
      });
    } catch (error) {
      throw error;
    }
  }

  async getByPaymentMethod(c: Context) {
    const paymentMethodId = c.req.param('paymentMethodId');
    
    try {
      return c.json({
        data: []
      });
    } catch (error) {
      throw error;
    }
  }

  async getMonthly(c: Context) {
    const year = c.req.param('year');
    const month = c.req.param('month');
    
    try {
      return c.json({
        data: []
      });
    } catch (error) {
      throw error;
    }
  }

  async getYearly(c: Context) {
    const year = c.req.param('year');
    
    try {
      return c.json({
        data: []
      });
    } catch (error) {
      throw error;
    }
  }
} 