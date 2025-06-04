import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateTransactionUseCase } from '@/application/use-cases/transaction/create-transaction.use-case.js';
import { ITransactionRepository } from '@/domain/repositories/transaction-repository.js';
import { ICategoryRepository } from '@/domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '@/domain/repositories/payment-method-repository.js';
import { TransactionService } from '@/domain/services/transaction-service.js';
import { Category } from '@/domain/entities/category.js';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { Transaction } from '@/domain/entities/transaction.js';
import { Money } from '@/domain/value-objects/money.js';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let mockTransactionRepo: vi.Mocked<ITransactionRepository>;
  let mockCategoryRepo: vi.Mocked<ICategoryRepository>;
  let mockPaymentMethodRepo: vi.Mocked<IPaymentMethodRepository>;
  let mockTransactionService: vi.Mocked<TransactionService>;

  const validIncomeCategory = new Category('cat-income', 'Salary', TransactionType.INCOME);
  const validExpenseCategory = new Category('cat-expense', 'Groceries', TransactionType.EXPENSE);
  const inactiveCategory = Category.create('cat-inactive', 'Inactive Category', TransactionType.EXPENSE);
  
  const validCreditCard = new PaymentMethod('pm-credit', 'Credit Card', PaymentMethodType.CREDIT_CARD);
  const validCash = new PaymentMethod('pm-cash', 'Cash', PaymentMethodType.CASH);
  const validBank = new PaymentMethod('pm-bank', 'Bank Account', PaymentMethodType.BANK);
  const inactivePaymentMethod = PaymentMethod.createCreditCard('pm-inactive', 'Inactive Card');

  // Deactivate inactive entities
  beforeEach(() => {
    inactiveCategory.deactivate();
    inactivePaymentMethod.deactivate();
  });

  beforeEach(() => {
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

    mockCategoryRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByType: vi.fn(),
      findActiveCategories: vi.fn(),
      findInactiveCategories: vi.fn(),
      findByName: vi.fn(),
      exists: vi.fn(),
      existsByName: vi.fn(),
    };

    mockPaymentMethodRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByType: vi.fn(),
      findActivePaymentMethods: vi.fn(),
      findInactivePaymentMethods: vi.fn(),
      findByName: vi.fn(),
      findSupportingInstallments: vi.fn(),
      exists: vi.fn(),
      existsByName: vi.fn(),
    };

    mockTransactionService = {
      validateTransaction: vi.fn(),
      calculateNetForPeriod: vi.fn(),
      getMonthlyBreakdown: vi.fn(),
      getCategorySpending: vi.fn(),
      getPaymentMethodUsage: vi.fn(),
      detectDuplicateTransactions: vi.fn(),
      calculateRunningBalance: vi.fn(),
    } as any;

    useCase = new CreateTransactionUseCase(
      mockTransactionRepo,
      mockCategoryRepo,
      mockPaymentMethodRepo,
      mockTransactionService
    );
  });

  describe('execute', () => {
    const validExpenseDTO = {
      date: '2024-01-15T10:30:00.000Z',
      amount: 100.50,
      currency: 'BRL',
      categoryId: 'cat-expense',
      paymentMethodId: 'pm-credit',
      type: 'expense' as const,
      description: 'Supermarket shopping',
    };

    const validIncomeDTO = {
      date: '2024-01-01T09:00:00.000Z',
      amount: 5000,
      currency: 'BRL',
      categoryId: 'cat-income',
      paymentMethodId: 'pm-bank',
      type: 'income' as const,
      description: 'Monthly salary',
    };

    describe('successful transaction creation', () => {
      it('should create expense transaction successfully with all required data', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.amount).toBe(100.50);
        expect(result.transaction?.currency).toBe('BRL');
        expect(result.transaction?.type).toBe('expense');
        expect(result.transaction?.categoryId).toBe('cat-expense');
        expect(result.transaction?.paymentMethodId).toBe('pm-credit');
        expect(result.transaction?.description).toBe('Supermarket shopping');
        expect(result.transaction?.source).toBe('manual');
        expect(result.transaction?.sourceId).toBeNull();
        expect(result.errors).toBeUndefined();

        expect(mockTransactionRepo.save).toHaveBeenCalledOnce();
        const savedTransaction = mockTransactionRepo.save.mock.calls[0][0] as Transaction;
        expect(savedTransaction.amount.amount).toBe(100.50);
        expect(savedTransaction.amount.currency).toBe('BRL');
        expect(savedTransaction.type).toBe(TransactionType.EXPENSE);
      });

      it('should create income transaction successfully with all required data', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validIncomeCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validBank);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validIncomeDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.amount).toBe(5000);
        expect(result.transaction?.type).toBe('income');
        expect(result.transaction?.categoryId).toBe('cat-income');
        expect(result.transaction?.paymentMethodId).toBe('pm-bank');
        expect(result.transaction?.description).toBe('Monthly salary');

        expect(mockTransactionRepo.save).toHaveBeenCalledOnce();
        const savedTransaction = mockTransactionRepo.save.mock.calls[0][0] as Transaction;
        expect(savedTransaction.type).toBe(TransactionType.INCOME);
      });

      it('should create transaction with minimal data (no description)', async () => {
        const minimalDTO = {
          date: '2024-01-15T10:30:00.000Z',
          amount: 50,
          currency: 'BRL',
          categoryId: 'cat-expense',
          paymentMethodId: 'pm-cash',
          type: 'expense' as const,
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCash);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(minimalDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.description).toBeNull();
        expect(result.transaction?.amount).toBe(50);
      });

      it('should create transaction with default currency when not specified', async () => {
        const dtoWithoutCurrency = {
          ...validExpenseDTO,
          currency: undefined,
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(dtoWithoutCurrency);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction?.currency).toBe('BRL'); // Default currency
      });
    });

    describe('category validation', () => {
      it('should fail when category not found', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(null);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category not found');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when category is inactive', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category is not active');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when category type does not match transaction type (income category for expense)', async () => {
        // Setup mocks - using income category for expense transaction
        mockCategoryRepo.findById.mockResolvedValue(validIncomeCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category cannot be used for expense transactions');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when category type does not match transaction type (expense category for income)', async () => {
        // Setup mocks - using expense category for income transaction
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validBank);

        // Execute
        const result = await useCase.execute(validIncomeDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category cannot be used for income transactions');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('payment method validation', () => {
      it('should fail when payment method not found', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method not found');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when payment method is inactive', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(inactivePaymentMethod);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method is not active');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('combined validation errors', () => {
      it('should return all validation errors when both category and payment method are invalid', async () => {
        // Setup mocks - both not found
        mockCategoryRepo.findById.mockResolvedValue(null);
        mockPaymentMethodRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Category not found');
        expect(result.errors).toContain('Payment method not found');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });

      it('should return all validation errors when entities exist but are invalid', async () => {
        // Setup mocks - both inactive and wrong type category
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(inactivePaymentMethod);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Category is not active');
        expect(result.errors).toContain('Payment method is not active');
      });
    });

    describe('transaction service validation', () => {
      it('should fail when transaction service validation fails', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: false,
          errors: ['Transaction amount exceeds daily limit', 'Invalid transaction date'],
        });

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Transaction amount exceeds daily limit', 'Invalid transaction date']);
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('duplicate detection', () => {
      it('should fail when potential duplicates are detected', async () => {
        const existingTransaction = Transaction.createManual(
          'existing-tx',
          new Date('2024-01-15T10:30:00.000Z'),
          new Money(100.50, 'BRL'),
          'cat-expense',
          'pm-credit',
          TransactionType.EXPENSE,
          'Existing transaction'
        );

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([existingTransaction]);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Potential duplicate transaction detected. Please verify this transaction is unique.');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.save).not.toHaveBeenCalled();
      });

      it('should proceed when no duplicates are detected', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(mockTransactionRepo.save).toHaveBeenCalledOnce();
      });
    });

    describe('error handling', () => {
      it('should handle repository save errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);
        mockTransactionRepo.save.mockRejectedValue(new Error('Database connection failed'));

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create transaction: Database connection failed']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle category repository errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockRejectedValue(new Error('Category database error'));
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create transaction: Category database error']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle payment method repository errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockRejectedValue(new Error('Payment method database error'));

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create transaction: Payment method database error']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle transaction service validation errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockRejectedValue(new Error('Validation service error'));

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create transaction: Validation service error']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle unknown errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);
        mockTransactionRepo.save.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create transaction: Unknown error']);
        expect(result.transaction).toBeUndefined();
      });
    });

    describe('domain object creation', () => {
      it('should create correct domain objects with proper transformations', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);

        // Execute
        await useCase.execute(validExpenseDTO);

        // Verify the transaction was created with correct domain objects
        expect(mockTransactionRepo.save).toHaveBeenCalledOnce();
        const savedTransaction = mockTransactionRepo.save.mock.calls[0][0] as Transaction;
        
        expect(savedTransaction.amount).toBeInstanceOf(Money);
        expect(savedTransaction.amount.amount).toBe(100.50);
        expect(savedTransaction.amount.currency).toBe('BRL');
        expect(savedTransaction.type).toBe(TransactionType.EXPENSE);
        expect(savedTransaction.date).toBeInstanceOf(Date);
        expect(savedTransaction.isManual()).toBe(true);
        expect(savedTransaction.source).toBe('manual');
        expect(savedTransaction.sourceId).toBeNull();
      });

      it('should generate unique transaction IDs', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);

        // Execute multiple times
        await useCase.execute(validExpenseDTO);
        await useCase.execute(validExpenseDTO);

        // Verify different IDs were generated
        expect(mockTransactionRepo.save).toHaveBeenCalledTimes(2);
        const firstTransaction = mockTransactionRepo.save.mock.calls[0][0] as Transaction;
        const secondTransaction = mockTransactionRepo.save.mock.calls[1][0] as Transaction;
        
        expect(firstTransaction.id).not.toBe(secondTransaction.id);
        expect(firstTransaction.id).toMatch(/^tx-\d+-\w+$/);
        expect(secondTransaction.id).toMatch(/^tx-\d+-\w+$/);
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTO', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionService.detectDuplicateTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validExpenseDTO);

        // Verify response structure
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction).toHaveProperty('id');
        expect(result.transaction).toHaveProperty('date');
        expect(result.transaction).toHaveProperty('amount');
        expect(result.transaction).toHaveProperty('currency');
        expect(result.transaction).toHaveProperty('categoryId');
        expect(result.transaction).toHaveProperty('paymentMethodId');
        expect(result.transaction).toHaveProperty('type');
        expect(result.transaction).toHaveProperty('description');
        expect(result.transaction).toHaveProperty('source');
        expect(result.transaction).toHaveProperty('sourceId');
        expect(result.transaction).toHaveProperty('createdAt');
        expect(result.transaction).toHaveProperty('updatedAt');

        // Verify dates are ISO strings
        expect(result.transaction!.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.transaction!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.transaction!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });
  });
}); 