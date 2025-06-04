import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListTransactionsUseCase } from '@/application/use-cases/transaction/list-transactions.use-case.js';
import { ITransactionRepository, PaginatedResult } from '@/domain/repositories/transaction-repository.js';
import { Transaction } from '@/domain/entities/transaction.js';
import { Money } from '@/domain/value-objects/money.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { ListTransactionsDTO } from '@/application/dto/transaction.dto.js';

describe('ListTransactionsUseCase', () => {
  let useCase: ListTransactionsUseCase;
  let mockTransactionRepo: vi.Mocked<ITransactionRepository>;

  // Test transactions for different scenarios
  let manualExpenseTransaction: Transaction;
  let manualIncomeTransaction: Transaction;
  let installmentTransaction: Transaction;
  let subscriptionTransaction: Transaction;

  beforeEach(() => {
    // Create test transactions
    manualExpenseTransaction = Transaction.createManual(
      'tx-manual-expense',
      new Date('2024-01-15T10:30:00.000Z'),
      new Money(100.50, 'BRL'),
      'cat-groceries',
      'pm-credit',
      TransactionType.EXPENSE,
      'Supermarket shopping'
    );

    manualIncomeTransaction = Transaction.createManual(
      'tx-manual-income',
      new Date('2024-01-01T09:00:00.000Z'),
      new Money(5000, 'BRL'),
      'cat-salary',
      'pm-bank',
      TransactionType.INCOME,
      'Monthly salary'
    );

    installmentTransaction = Transaction.createFromInstallment(
      'tx-installment',
      new Date('2024-01-10T14:00:00.000Z'),
      new Money(250, 'BRL'),
      'cat-electronics',
      'pm-credit',
      TransactionType.EXPENSE,
      'installment-plan-1',
      'Laptop payment 1/12'
    );

    subscriptionTransaction = Transaction.createFromSubscription(
      'tx-subscription',
      new Date('2024-01-05T12:00:00.000Z'),
      new Money(39.99, 'BRL'),
      'cat-services',
      'pm-credit',
      TransactionType.EXPENSE,
      'subscription-1',
      'Netflix monthly'
    );

    // Setup mock repository
    mockTransactionRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByDateRange: vi.fn(),
      findByMonth: vi.fn(),
      findByYear: vi.fn(),
      findByCategory: vi.fn(),
      findByPaymentMethod: vi.fn(),
      findBySource: vi.fn(),
      findByInstallmentPlan: vi.fn(),
      findBySubscription: vi.fn(),
      findPaginated: vi.fn(),
      getTotalByCategory: vi.fn(),
      getTotalByPaymentMethod: vi.fn(),
      getTotalIncomeForPeriod: vi.fn(),
      getTotalExpenseForPeriod: vi.fn(),
      getMonthlyTotals: vi.fn(),
      exists: vi.fn(),
    };

    useCase = new ListTransactionsUseCase(mockTransactionRepo);
  });

  describe('execute', () => {
    describe('successful listing', () => {
      it('should list transactions with default pagination', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, manualIncomeTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {};

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.items).toHaveLength(2);
        expect(result.data?.totalItems).toBe(2);
        expect(result.data?.totalPages).toBe(1);
        expect(result.data?.currentPage).toBe(1);
        expect(result.data?.hasNext).toBe(false);
        expect(result.data?.hasPrevious).toBe(false);
        expect(result.errors).toBeUndefined();

        // Verify repository call with defaults
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {});
      });

      it('should list transactions with custom pagination', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction],
          totalItems: 25,
          totalPages: 5,
          currentPage: 2,
          hasNext: true,
          hasPrevious: true,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          page: 2,
          limit: 5,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.currentPage).toBe(2);
        expect(result.data?.totalPages).toBe(5);
        expect(result.data?.hasNext).toBe(true);
        expect(result.data?.hasPrevious).toBe(true);

        // Verify repository call with custom pagination
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(2, 5, {});
      });

      it('should list transactions with category filter', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          categoryId: 'cat-groceries',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(1);

        // Verify repository call with category filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          categoryId: 'cat-groceries',
        });
      });

      it('should list transactions with payment method filter', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, installmentTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          paymentMethodId: 'pm-credit',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(2);

        // Verify repository call with payment method filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          paymentMethodId: 'pm-credit',
        });
      });

      it('should list transactions with date range filter', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, installmentTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          startDate: '2024-01-10T00:00:00.000Z',
          endDate: '2024-01-20T23:59:59.999Z',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(2);

        // Verify repository call with date range filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          startDate: new Date('2024-01-10T00:00:00.000Z'),
          endDate: new Date('2024-01-20T23:59:59.999Z'),
        });
      });

      it('should list transactions with type filter (expense)', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, installmentTransaction, subscriptionTransaction],
          totalItems: 3,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          type: 'expense',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(3);

        // Verify repository call with type filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          type: 'expense',
        });
      });

      it('should list transactions with type filter (income)', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualIncomeTransaction],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          type: 'income',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(1);

        // Verify repository call with type filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          type: 'income',
        });
      });

      it('should list transactions with source filter (manual)', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, manualIncomeTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          source: 'manual',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(2);

        // Verify repository call with source filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          source: 'manual',
        });
      });

      it('should list transactions with source filter (installment)', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [installmentTransaction],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          source: 'installment',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(1);

        // Verify repository call with source filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          source: 'installment',
        });
      });

      it('should list transactions with source filter (subscription)', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [subscriptionTransaction],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          source: 'subscription',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(1);

        // Verify repository call with source filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          source: 'subscription',
        });
      });

      it('should list transactions with description filter', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          description: 'Supermarket',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(1);

        // Verify repository call with description filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          description: 'Supermarket',
        });
      });

      it('should list transactions with amount range filter', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, installmentTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          minAmount: 100,
          maxAmount: 300,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(2);

        // Verify repository call with amount range filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          minAmount: 100,
          maxAmount: 300,
        });
      });

      it('should list transactions with minimum amount filter only', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualIncomeTransaction, installmentTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          minAmount: 200,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(2);

        // Verify repository call with minimum amount filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          minAmount: 200,
        });
      });

      it('should list transactions with maximum amount filter only', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, subscriptionTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          maxAmount: 150,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(2);

        // Verify repository call with maximum amount filter
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          maxAmount: 150,
        });
      });

      it('should handle zero amount filters correctly', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          minAmount: 0,
          maxAmount: 0,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(0);

        // Verify repository call includes zero amounts
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          minAmount: 0,
          maxAmount: 0,
        });
      });
    });

    describe('multiple filters combination', () => {
      it('should list transactions with multiple filters combined', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          page: 1,
          limit: 10,
          categoryId: 'cat-groceries',
          paymentMethodId: 'pm-credit',
          type: 'expense',
          source: 'manual',
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z',
          description: 'Supermarket',
          minAmount: 50,
          maxAmount: 200,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(1);

        // Verify repository call with all filters
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 10, {
          categoryId: 'cat-groceries',
          paymentMethodId: 'pm-credit',
          type: 'expense',
          source: 'manual',
          startDate: new Date('2024-01-01T00:00:00.000Z'),
          endDate: new Date('2024-01-31T23:59:59.999Z'),
          description: 'Supermarket',
          minAmount: 50,
          maxAmount: 200,
        });
      });

      it('should exclude undefined filters from query', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction],
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          categoryId: 'cat-groceries',
          paymentMethodId: undefined,
          type: 'expense',
          source: undefined,
          startDate: undefined,
          endDate: undefined,
          description: undefined,
          minAmount: undefined,
          maxAmount: undefined,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);

        // Verify repository call excludes undefined values
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          categoryId: 'cat-groceries',
          type: 'expense',
        });
      });
    });

    describe('empty results', () => {
      it('should handle empty results gracefully', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          categoryId: 'non-existent-category',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(0);
        expect(result.data?.totalItems).toBe(0);
        expect(result.data?.totalPages).toBe(0);
        expect(result.data?.hasNext).toBe(false);
        expect(result.data?.hasPrevious).toBe(false);
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTOs', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, manualIncomeTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {};

        // Execute
        const result = await useCase.execute(dto);

        // Verify response structure
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.items).toHaveLength(2);

        // Verify first transaction DTO
        const firstTransaction = result.data!.items[0];
        expect(firstTransaction).toHaveProperty('id');
        expect(firstTransaction).toHaveProperty('date');
        expect(firstTransaction).toHaveProperty('amount');
        expect(firstTransaction).toHaveProperty('currency');
        expect(firstTransaction).toHaveProperty('categoryId');
        expect(firstTransaction).toHaveProperty('paymentMethodId');
        expect(firstTransaction).toHaveProperty('type');
        expect(firstTransaction).toHaveProperty('description');
        expect(firstTransaction).toHaveProperty('source');
        expect(firstTransaction).toHaveProperty('sourceId');
        expect(firstTransaction).toHaveProperty('createdAt');
        expect(firstTransaction).toHaveProperty('updatedAt');

        // Verify dates are ISO strings
        expect(firstTransaction.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(firstTransaction.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(firstTransaction.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

        // Verify pagination structure
        expect(result.data).toHaveProperty('totalItems');
        expect(result.data).toHaveProperty('totalPages');
        expect(result.data).toHaveProperty('currentPage');
        expect(result.data).toHaveProperty('hasNext');
        expect(result.data).toHaveProperty('hasPrevious');
      });
    });

    describe('pagination edge cases', () => {
      it('should handle large page numbers', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [],
          totalItems: 100,
          totalPages: 10,
          currentPage: 999,
          hasNext: false,
          hasPrevious: true,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          page: 999,
          limit: 10,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.currentPage).toBe(999);
        expect(result.data?.items).toHaveLength(0);

        // Verify repository was called with large page number
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(999, 10, {});
      });

      it('should handle very large limit values', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [manualExpenseTransaction, manualIncomeTransaction],
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          page: 1,
          limit: 1000,
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(2);

        // Verify repository was called with large limit
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 1000, {});
      });
    });

    describe('error handling', () => {
      it('should handle repository errors gracefully', async () => {
        // Setup mocks
        mockTransactionRepo.findPaginated.mockRejectedValue(new Error('Database connection failed'));

        const dto: ListTransactionsDTO = {};

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to list transactions: Database connection failed']);
        expect(result.data).toBeUndefined();
      });

      it('should handle invalid date format errors', async () => {
        // Setup mocks to simulate date parsing error
        mockTransactionRepo.findPaginated.mockRejectedValue(new Error('Invalid date format'));

        const dto: ListTransactionsDTO = {
          startDate: 'invalid-date',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to list transactions: Invalid date format']);
        expect(result.data).toBeUndefined();
      });

      it('should handle repository timeout errors', async () => {
        // Setup mocks
        mockTransactionRepo.findPaginated.mockRejectedValue(new Error('Query timeout'));

        const dto: ListTransactionsDTO = {};

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to list transactions: Query timeout']);
        expect(result.data).toBeUndefined();
      });

      it('should handle unknown errors gracefully', async () => {
        // Setup mocks
        mockTransactionRepo.findPaginated.mockRejectedValue('Non-error object');

        const dto: ListTransactionsDTO = {};

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to list transactions: Unknown error']);
        expect(result.data).toBeUndefined();
      });
    });

    describe('filter building', () => {
      it('should handle empty string filters correctly', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          categoryId: '',
          paymentMethodId: '',
          description: '',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify - empty strings should still be passed as filters
        expect(result.success).toBe(true);
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          categoryId: '',
          paymentMethodId: '',
          description: '',
        });
      });

      it('should handle edge case date values', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {
          startDate: '1970-01-01T00:00:00.000Z',
          endDate: '2099-12-31T23:59:59.999Z',
        };

        // Execute
        const result = await useCase.execute(dto);

        // Verify
        expect(result.success).toBe(true);
        expect(mockTransactionRepo.findPaginated).toHaveBeenCalledWith(1, 20, {
          startDate: new Date('1970-01-01T00:00:00.000Z'),
          endDate: new Date('2099-12-31T23:59:59.999Z'),
        });
      });
    });

    describe('response format', () => {
      it('should return success response with data property', async () => {
        const mockResult: PaginatedResult<Transaction> = {
          items: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrevious: false,
        };

        // Setup mocks
        mockTransactionRepo.findPaginated.mockResolvedValue(mockResult);

        const dto: ListTransactionsDTO = {};

        // Execute
        const result = await useCase.execute(dto);

        // Verify response structure
        expect(result).toEqual({
          success: true,
          data: {
            items: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            hasNext: false,
            hasPrevious: false,
          },
        });
        expect(result).not.toHaveProperty('transaction');
        expect(result.errors).toBeUndefined();
      });

      it('should return error response with proper structure', async () => {
        // Setup mocks
        mockTransactionRepo.findPaginated.mockRejectedValue(new Error('Database error'));

        const dto: ListTransactionsDTO = {};

        // Execute
        const result = await useCase.execute(dto);

        // Verify response structure
        expect(result).toEqual({
          success: false,
          errors: ['Failed to list transactions: Database error'],
        });
        expect(result).not.toHaveProperty('data');
        expect(result).not.toHaveProperty('transaction');
      });
    });
  });
}); 