import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateTransactionUseCase } from '@/application/use-cases/transaction/update-transaction.use-case.js';
import { ITransactionRepository } from '@/domain/repositories/transaction-repository.js';
import { ICategoryRepository } from '@/domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '@/domain/repositories/payment-method-repository.js';
import { TransactionService } from '@/domain/services/transaction-service.js';
import { Transaction, TransactionSource } from '@/domain/entities/transaction.js';
import { Category } from '@/domain/entities/category.js';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method.js';
import { Money } from '@/domain/value-objects/money.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { UpdateTransactionDTO } from '@/application/dto/transaction.dto.js';

describe('UpdateTransactionUseCase', () => {
  let useCase: UpdateTransactionUseCase;
  let mockTransactionRepo: vi.Mocked<ITransactionRepository>;
  let mockCategoryRepo: vi.Mocked<ICategoryRepository>;
  let mockPaymentMethodRepo: vi.Mocked<IPaymentMethodRepository>;
  let mockTransactionService: vi.Mocked<TransactionService>;

  // Test entities
  const originalCategory = new Category('cat-original', 'Original Category', TransactionType.EXPENSE);
  const newCategory = new Category('cat-new', 'New Category', TransactionType.EXPENSE);
  const incomeCategory = new Category('cat-income', 'Income Category', TransactionType.INCOME);
  const inactiveCategory = Category.create('cat-inactive', 'Inactive Category', TransactionType.EXPENSE);
  
  const originalPaymentMethod = new PaymentMethod('pm-original', 'Original Card', PaymentMethodType.CREDIT_CARD);
  const newPaymentMethod = new PaymentMethod('pm-new', 'New Card', PaymentMethodType.CREDIT_CARD);
  const inactivePaymentMethod = PaymentMethod.createCreditCard('pm-inactive', 'Inactive Card');

  // Test transactions
  let manualTransaction: Transaction;
  let installmentTransaction: Transaction;
  let subscriptionTransaction: Transaction;

  beforeEach(() => {
    // Deactivate inactive entities
    inactiveCategory.deactivate();
    inactivePaymentMethod.deactivate();

    // Create test transactions
    manualTransaction = Transaction.createManual(
      'tx-manual',
      new Date('2024-01-15T10:30:00.000Z'),
      new Money(100.50, 'BRL'),
      'cat-original',
      'pm-original',
      TransactionType.EXPENSE,
      'Original description'
    );

    installmentTransaction = Transaction.createFromInstallment(
      'tx-installment',
      new Date('2024-01-15T10:30:00.000Z'),
      new Money(200, 'BRL'),
      'cat-original',
      'pm-original',
      TransactionType.EXPENSE,
      'installment-plan-1',
      'Installment payment 1/12'
    );

    subscriptionTransaction = Transaction.createFromSubscription(
      'tx-subscription',
      new Date('2024-01-15T10:30:00.000Z'),
      new Money(50, 'BRL'),
      'cat-original',
      'pm-original',
      TransactionType.EXPENSE,
      'subscription-1',
      'Monthly subscription'
    );

    // Setup mocks
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

    useCase = new UpdateTransactionUseCase(
      mockTransactionRepo,
      mockCategoryRepo,
      mockPaymentMethodRepo,
      mockTransactionService
    );
  });

  describe('execute', () => {
    describe('successful updates', () => {
      it('should update transaction date successfully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          date: '2024-02-15T14:30:00.000Z',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.date).toBe('2024-02-15T14:30:00.000Z');
        expect(result.errors).toBeUndefined();
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });

      it('should update transaction amount successfully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          amount: 250.75,
          currency: 'USD',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.amount).toBe(250.75);
        expect(result.transaction?.currency).toBe('USD');
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });

      it('should update category successfully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          categoryId: 'cat-new',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockCategoryRepo.findById.mockResolvedValue(newCategory);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.categoryId).toBe('cat-new');
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });

      it('should update payment method successfully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          paymentMethodId: 'pm-new',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockPaymentMethodRepo.findById.mockResolvedValue(newPaymentMethod);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.paymentMethodId).toBe('pm-new');
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });

      it('should update description successfully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          description: 'Updated description',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.description).toBe('Updated description');
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });

      it('should update multiple fields simultaneously', async () => {
        const updateDTO: UpdateTransactionDTO = {
          date: '2024-03-20T16:45:00.000Z',
          amount: 500,
          currency: 'EUR',
          categoryId: 'cat-new',
          paymentMethodId: 'pm-new',
          description: 'Completely updated transaction',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockCategoryRepo.findById.mockResolvedValue(newCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(newPaymentMethod);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.date).toBe('2024-03-20T16:45:00.000Z');
        expect(result.transaction?.amount).toBe(500);
        expect(result.transaction?.currency).toBe('EUR');
        expect(result.transaction?.categoryId).toBe('cat-new');
        expect(result.transaction?.paymentMethodId).toBe('pm-new');
        expect(result.transaction?.description).toBe('Completely updated transaction');
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });

      it('should update description to null', async () => {
        const updateDTO: UpdateTransactionDTO = {
          description: null,
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.description).toBeNull();
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });
    });

    describe('transaction not found', () => {
      it('should fail when transaction does not exist', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(null);

        const updateDTO: UpdateTransactionDTO = {
          description: 'New description',
        };

        // Execute
        const result = await useCase.execute('non-existent-tx', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Transaction not found']);
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });
    });

    describe('non-manual transaction restrictions', () => {
      it('should fail when trying to update installment transaction', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(installmentTransaction);

        const updateDTO: UpdateTransactionDTO = {
          description: 'Trying to update installment',
        };

        // Execute
        const result = await useCase.execute('tx-installment', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Only manual transactions can be updated. Installment and subscription transactions are read-only.']);
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });

      it('should fail when trying to update subscription transaction', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(subscriptionTransaction);

        const updateDTO: UpdateTransactionDTO = {
          amount: 75,
        };

        // Execute
        const result = await useCase.execute('tx-subscription', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Only manual transactions can be updated. Installment and subscription transactions are read-only.']);
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });
    });

    describe('category validation', () => {
      it('should fail when new category does not exist', async () => {
        const updateDTO: UpdateTransactionDTO = {
          categoryId: 'non-existent-category',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockCategoryRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category not found');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });

      it('should fail when new category is inactive', async () => {
        const updateDTO: UpdateTransactionDTO = {
          categoryId: 'cat-inactive',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category is not active');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });
    });

    describe('payment method validation', () => {
      it('should fail when new payment method does not exist', async () => {
        const updateDTO: UpdateTransactionDTO = {
          paymentMethodId: 'non-existent-pm',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockPaymentMethodRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method not found');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });

      it('should fail when new payment method is inactive', async () => {
        const updateDTO: UpdateTransactionDTO = {
          paymentMethodId: 'pm-inactive',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockPaymentMethodRepo.findById.mockResolvedValue(inactivePaymentMethod);

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method is not active');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });
    });

    describe('combined validation errors', () => {
      it('should return all validation errors when both category and payment method are invalid', async () => {
        const updateDTO: UpdateTransactionDTO = {
          categoryId: 'non-existent-category',
          paymentMethodId: 'non-existent-pm',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockCategoryRepo.findById.mockResolvedValue(null);
        mockPaymentMethodRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Category not found');
        expect(result.errors).toContain('Payment method not found');
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });
    });

    describe('transaction service validation', () => {
      it('should fail when transaction service validation fails after update', async () => {
        const updateDTO: UpdateTransactionDTO = {
          amount: 999999, // Assuming this triggers a business rule violation
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: false,
          errors: ['Transaction amount exceeds maximum allowed limit'],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Transaction amount exceeds maximum allowed limit']);
        expect(result.transaction).toBeUndefined();
        expect(mockTransactionRepo.update).not.toHaveBeenCalled();
      });
    });

    describe('partial updates', () => {
      it('should update only specified fields and leave others unchanged', async () => {
        const updateDTO: UpdateTransactionDTO = {
          amount: 150,
          // Only updating amount, other fields should remain the same
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transaction).toBeDefined();
        expect(result.transaction?.amount).toBe(150);
        expect(result.transaction?.categoryId).toBe('cat-original'); // Unchanged
        expect(result.transaction?.paymentMethodId).toBe('pm-original'); // Unchanged
        expect(result.transaction?.description).toBe('Original description'); // Unchanged
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });

      it('should not call validation for unchanged related entities', async () => {
        const updateDTO: UpdateTransactionDTO = {
          amount: 150,
          description: 'New description only',
          // Not updating category or payment method
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(mockCategoryRepo.findById).not.toHaveBeenCalled();
        expect(mockPaymentMethodRepo.findById).not.toHaveBeenCalled();
        expect(mockTransactionRepo.update).toHaveBeenCalledWith(manualTransaction);
      });
    });

    describe('error handling', () => {
      it('should handle repository update errors gracefully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          description: 'Updated description',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionRepo.update.mockRejectedValue(new Error('Database update failed'));

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to update transaction: Database update failed']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle transaction repository findById errors gracefully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          description: 'Updated description',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockRejectedValue(new Error('Database connection failed'));

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to update transaction: Database connection failed']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle category repository errors gracefully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          categoryId: 'cat-new',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockCategoryRepo.findById.mockRejectedValue(new Error('Category database error'));

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to update transaction: Category database error']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle payment method repository errors gracefully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          paymentMethodId: 'pm-new',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockPaymentMethodRepo.findById.mockRejectedValue(new Error('Payment method database error'));

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to update transaction: Payment method database error']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle transaction service validation errors gracefully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          amount: 200,
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockRejectedValue(new Error('Validation service error'));

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to update transaction: Validation service error']);
        expect(result.transaction).toBeUndefined();
      });

      it('should handle unknown errors gracefully', async () => {
        const updateDTO: UpdateTransactionDTO = {
          description: 'Updated description',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockTransactionRepo.update.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to update transaction: Unknown error']);
        expect(result.transaction).toBeUndefined();
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTO after update', async () => {
        const updateDTO: UpdateTransactionDTO = {
          amount: 175.25,
          description: 'Updated transaction',
        };

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionService.validateTransaction.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        // Execute
        const result = await useCase.execute('tx-manual', updateDTO);

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

        // Verify updated values
        expect(result.transaction!.amount).toBe(175.25);
        expect(result.transaction!.description).toBe('Updated transaction');

        // Verify dates are ISO strings
        expect(result.transaction!.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.transaction!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.transaction!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });
  });
}); 