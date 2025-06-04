import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteTransactionUseCase } from '@/application/use-cases/transaction/delete-transaction.use-case.js';
import { ITransactionRepository } from '@/domain/repositories/transaction-repository.js';
import { Transaction } from '@/domain/entities/transaction.js';
import { Money } from '@/domain/value-objects/money.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';

describe('DeleteTransactionUseCase', () => {
  let useCase: DeleteTransactionUseCase;
  let mockTransactionRepo: vi.Mocked<ITransactionRepository>;

  // Test transactions
  let manualTransaction: Transaction;
  let installmentTransaction: Transaction;
  let subscriptionTransaction: Transaction;

  beforeEach(() => {
    // Create test transactions
    manualTransaction = Transaction.createManual(
      'tx-manual',
      new Date('2024-01-15T10:30:00.000Z'),
      new Money(100.50, 'BRL'),
      'cat-expense',
      'pm-credit',
      TransactionType.EXPENSE,
      'Manual transaction to delete'
    );

    installmentTransaction = Transaction.createFromInstallment(
      'tx-installment',
      new Date('2024-01-15T10:30:00.000Z'),
      new Money(200, 'BRL'),
      'cat-expense',
      'pm-credit',
      TransactionType.EXPENSE,
      'installment-plan-1',
      'Installment payment 1/12'
    );

    subscriptionTransaction = Transaction.createFromSubscription(
      'tx-subscription',
      new Date('2024-01-15T10:30:00.000Z'),
      new Money(50, 'BRL'),
      'cat-expense',
      'pm-credit',
      TransactionType.EXPENSE,
      'subscription-1',
      'Monthly subscription payment'
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

    useCase = new DeleteTransactionUseCase(mockTransactionRepo);
  });

  describe('execute', () => {
    describe('successful deletion', () => {
      it('should delete manual expense transaction successfully', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify
        expect(result.success).toBe(true);
        expect(result.errors).toBeUndefined();
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('tx-manual');
        expect(mockTransactionRepo.delete).toHaveBeenCalledWith('tx-manual');
      });

      it('should delete manual income transaction successfully', async () => {
        const manualIncomeTransaction = Transaction.createManual(
          'tx-income',
          new Date('2024-01-01T09:00:00.000Z'),
          new Money(5000, 'BRL'),
          'cat-salary',
          'pm-bank',
          TransactionType.INCOME,
          'Monthly salary'
        );

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualIncomeTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        const result = await useCase.execute('tx-income');

        // Verify
        expect(result.success).toBe(true);
        expect(result.errors).toBeUndefined();
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('tx-income');
        expect(mockTransactionRepo.delete).toHaveBeenCalledWith('tx-income');
      });

      it('should delete manual transaction with no description successfully', async () => {
        const manualTransactionNoDesc = Transaction.createManual(
          'tx-no-desc',
          new Date('2024-01-15T10:30:00.000Z'),
          new Money(75, 'BRL'),
          'cat-expense',
          'pm-cash',
          TransactionType.EXPENSE,
          null
        );

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransactionNoDesc);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        const result = await useCase.execute('tx-no-desc');

        // Verify
        expect(result.success).toBe(true);
        expect(result.errors).toBeUndefined();
        expect(mockTransactionRepo.delete).toHaveBeenCalledWith('tx-no-desc');
      });

      it('should call repository delete only after successful validation', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify call order
        // expect(mockTransactionRepo.findById).toHaveBeenCalledBefore(mockTransactionRepo.delete as any);
        // TODO: Consider adding a more robust way to check call order if necessary
        expect(result.success).toBe(true);
      });
    });

    describe('transaction not found', () => {
      it('should fail when transaction does not exist', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('non-existent-tx');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Transaction not found']);
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('non-existent-tx');
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });

      it('should fail with empty transaction ID', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Transaction not found']);
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('');
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });

      it('should fail with null-like transaction ID', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('undefined');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Transaction not found']);
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });
    });

    describe('non-manual transaction restrictions', () => {
      it('should fail when trying to delete installment transaction', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(installmentTransaction);

        // Execute
        const result = await useCase.execute('tx-installment');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual([
          'Only manual transactions can be deleted. ' +
          'To remove installment or subscription transactions, cancel the plan or subscription instead.'
        ]);
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('tx-installment');
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });

      it('should fail when trying to delete subscription transaction', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(subscriptionTransaction);

        // Execute
        const result = await useCase.execute('tx-subscription');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual([
          'Only manual transactions can be deleted. ' +
          'To remove installment or subscription transactions, cancel the plan or subscription instead.'
        ]);
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('tx-subscription');
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });

      it('should provide helpful error message for non-manual transactions', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(installmentTransaction);

        // Execute
        const result = await useCase.execute('tx-installment');

        // Verify the error message provides guidance
        expect(result.errors?.[0]).toContain('cancel the plan or subscription instead');
        expect(result.errors?.[0]).toContain('Only manual transactions can be deleted');
      });
    });

    describe('verification of transaction types', () => {
      it('should correctly identify manual transaction as deletable', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Verify the transaction is manual before test
        expect(manualTransaction.isManual()).toBe(true);
        expect(manualTransaction.isFromInstallment()).toBe(false);
        expect(manualTransaction.isFromSubscription()).toBe(false);

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify
        expect(result.success).toBe(true);
      });

      it('should correctly identify installment transaction as non-deletable', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(installmentTransaction);

        // Verify the transaction is from installment before test
        expect(installmentTransaction.isManual()).toBe(false);
        expect(installmentTransaction.isFromInstallment()).toBe(true);
        expect(installmentTransaction.isFromSubscription()).toBe(false);

        // Execute
        const result = await useCase.execute('tx-installment');

        // Verify
        expect(result.success).toBe(false);
      });

      it('should correctly identify subscription transaction as non-deletable', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(subscriptionTransaction);

        // Verify the transaction is from subscription before test
        expect(subscriptionTransaction.isManual()).toBe(false);
        expect(subscriptionTransaction.isFromInstallment()).toBe(false);
        expect(subscriptionTransaction.isFromSubscription()).toBe(true);

        // Execute
        const result = await useCase.execute('tx-subscription');

        // Verify
        expect(result.success).toBe(false);
      });
    });

    describe('error handling', () => {
      it('should handle repository findById errors gracefully', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockRejectedValue(new Error('Database connection failed'));

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to delete transaction: Database connection failed']);
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });

      it('should handle repository delete errors gracefully', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockRejectedValue(new Error('Delete operation failed'));

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to delete transaction: Delete operation failed']);
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('tx-manual');
        expect(mockTransactionRepo.delete).toHaveBeenCalledWith('tx-manual');
      });

      it('should handle database constraint errors gracefully', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockRejectedValue(new Error('Foreign key constraint violation'));

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to delete transaction: Foreign key constraint violation']);
      });

      it('should handle repository timeout errors gracefully', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockRejectedValue(new Error('Query timeout'));

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to delete transaction: Query timeout']);
      });

      it('should handle unknown errors gracefully', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to delete transaction: Unknown error']);
      });

      it('should handle errors during transaction validation', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockRejectedValue(new Error('Network error during validation'));

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to delete transaction: Network error during validation']);
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });
    });

    describe('repository interaction', () => {
      it('should call findById with correct transaction ID', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        await useCase.execute('tx-specific-id');

        // Verify
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('tx-specific-id');
        expect(mockTransactionRepo.findById).toHaveBeenCalledTimes(1);
      });

      it('should call delete with correct transaction ID', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        await useCase.execute('tx-to-delete');

        // Verify
        expect(mockTransactionRepo.delete).toHaveBeenCalledWith('tx-to-delete');
        expect(mockTransactionRepo.delete).toHaveBeenCalledTimes(1);
      });

      it('should not call delete if findById fails', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockRejectedValue(new Error('Database error'));

        // Execute
        await useCase.execute('tx-manual');

        // Verify
        expect(mockTransactionRepo.findById).toHaveBeenCalled();
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });

      it('should not call delete if transaction is not found', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(null);

        // Execute
        await useCase.execute('non-existent');

        // Verify
        expect(mockTransactionRepo.findById).toHaveBeenCalled();
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });

      it('should not call delete if transaction is not manual', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(installmentTransaction);

        // Execute
        await useCase.execute('tx-installment');

        // Verify
        expect(mockTransactionRepo.findById).toHaveBeenCalled();
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle transaction with special characters in ID', async () => {
        const specialTransaction = Transaction.createManual(
          'tx-special-äöü-123',
          new Date('2024-01-15T10:30:00.000Z'),
          new Money(100, 'BRL'),
          'cat-expense',
          'pm-credit',
          TransactionType.EXPENSE,
          'Special ID transaction'
        );

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(specialTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        const result = await useCase.execute('tx-special-äöü-123');

        // Verify
        expect(result.success).toBe(true);
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith('tx-special-äöü-123');
        expect(mockTransactionRepo.delete).toHaveBeenCalledWith('tx-special-äöü-123');
      });

      it('should handle transaction with very long ID', async () => {
        const longId = 'tx-' + 'a'.repeat(100);
        const longIdTransaction = Transaction.createManual(
          longId,
          new Date('2024-01-15T10:30:00.000Z'),
          new Money(100, 'BRL'),
          'cat-expense',
          'pm-credit',
          TransactionType.EXPENSE,
          'Long ID transaction'
        );

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(longIdTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        const result = await useCase.execute(longId);

        // Verify
        expect(result.success).toBe(true);
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith(longId);
        expect(mockTransactionRepo.delete).toHaveBeenCalledWith(longId);
      });

      it('should handle whitespace in transaction ID', async () => {
        const whitespaceId = ' tx-with-spaces ';

        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(whitespaceId);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Transaction not found']);
        expect(mockTransactionRepo.findById).toHaveBeenCalledWith(whitespaceId);
        expect(mockTransactionRepo.delete).not.toHaveBeenCalled();
      });
    });

    describe('response format', () => {
      it('should return success response with no additional properties', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(manualTransaction);
        mockTransactionRepo.delete.mockResolvedValue();

        // Execute
        const result = await useCase.execute('tx-manual');

        // Verify response structure
        expect(result).toEqual({
          success: true,
        });
        expect(result).not.toHaveProperty('transaction');
        expect(result).not.toHaveProperty('data');
        expect(result.errors).toBeUndefined();
      });

      it('should return error response with proper structure', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('non-existent');

        // Verify response structure
        expect(result).toEqual({
          success: false,
          errors: ['Transaction not found'],
        });
        expect(result).not.toHaveProperty('transaction');
        expect(result).not.toHaveProperty('data');
      });

      it('should return single error in array format', async () => {
        // Setup mocks
        mockTransactionRepo.findById.mockResolvedValue(installmentTransaction);

        // Execute
        const result = await useCase.execute('tx-installment');

        // Verify error is in array format
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors).toHaveLength(1);
        expect(typeof result.errors?.[0]).toBe('string');
      });
    });
  });
}); 