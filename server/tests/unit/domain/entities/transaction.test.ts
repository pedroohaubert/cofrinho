import { describe, it, expect, beforeEach } from 'vitest';
import { Transaction, TransactionSource } from '@/domain/entities/transaction.js';
import { Money } from '@/domain/value-objects/money.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';

describe('Transaction Entity', () => {
  let transactionData: {
    id: string;
    date: Date;
    amount: Money;
    categoryId: string;
    paymentMethodId: string;
    type: TransactionType;
    description: string;
  };

  beforeEach(() => {
    transactionData = {
      id: 'txn-123',
      date: new Date('2024-01-15'),
      amount: new Money(10000, 'BRL'), // R$ 100.00
      categoryId: 'cat-food',
      paymentMethodId: 'pm-credit',
      type: TransactionType.EXPENSE,
      description: 'Grocery shopping'
    };
  });

  describe('constructor', () => {
    it('should create a transaction with all required fields', () => {
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description
      );

      expect(transaction.id).toBe(transactionData.id);
      expect(transaction.date).toEqual(transactionData.date);
      expect(transaction.amount).toEqual(transactionData.amount);
      expect(transaction.categoryId).toBe(transactionData.categoryId);
      expect(transaction.paymentMethodId).toBe(transactionData.paymentMethodId);
      expect(transaction.type).toBe(transactionData.type);
      expect(transaction.description).toBe(transactionData.description);
      expect(transaction.source).toBe(TransactionSource.MANUAL);
      expect(transaction.sourceId).toBeNull();
      expect(transaction.createdAt).toBeInstanceOf(Date);
      expect(transaction.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a transaction without description', () => {
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );

      expect(transaction.description).toBeNull();
    });

    it('should create a transaction with installment source', () => {
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.INSTALLMENT,
        'installment-123'
      );

      expect(transaction.source).toBe(TransactionSource.INSTALLMENT);
      expect(transaction.sourceId).toBe('installment-123');
    });

    it('should create a transaction with subscription source', () => {
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.SUBSCRIPTION,
        'subscription-123'
      );

      expect(transaction.source).toBe(TransactionSource.SUBSCRIPTION);
      expect(transaction.sourceId).toBe('subscription-123');
    });

    it('should accept custom created and updated dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.MANUAL,
        null,
        createdAt,
        updatedAt
      );

      expect(transaction.createdAt).toEqual(createdAt);
      expect(transaction.updatedAt).toEqual(updatedAt);
    });

    it('should trim whitespace from description', () => {
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        '  Grocery shopping  '
      );

      expect(transaction.description).toBe('Grocery shopping');
    });

    it('should convert empty description to null', () => {
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        ''
      );

      expect(transaction.description).toBeNull();
    });
  });

  describe('constructor validation', () => {
    it('should throw error for empty id', () => {
      expect(() => new Transaction(
        '',
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      )).toThrow('Transaction ID cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(() => new Transaction(
        '   ',
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      )).toThrow('Transaction ID cannot be empty');
    });

    it('should throw error for invalid date', () => {
      expect(() => new Transaction(
        transactionData.id,
        new Date('invalid'),
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      )).toThrow('Invalid transaction date');
    });

    it('should throw error for date more than 1 year in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      
      expect(() => new Transaction(
        transactionData.id,
        futureDate,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      )).toThrow('Transaction date cannot be more than 1 year in the future');
    });

    it('should throw error for zero amount', () => {
      const zeroAmount = new Money(0, 'BRL');
      expect(() => new Transaction(
        transactionData.id,
        transactionData.date,
        zeroAmount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      )).toThrow('Transaction amount must be positive');
    });

    it('should throw error for negative amount', () => {
      // Since Money constructor throws for negative amounts, we test that too
      expect(() => {
        const negativeAmount = new Money(-100, 'BRL');
        new Transaction(
          transactionData.id,
          transactionData.date,
          negativeAmount,
          transactionData.categoryId,
          transactionData.paymentMethodId,
          transactionData.type
        );
      }).toThrow('Amount cannot be negative');
    });

    it('should throw error for empty category id', () => {
      expect(() => new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        '',
        transactionData.paymentMethodId,
        transactionData.type
      )).toThrow('Category ID cannot be empty');
    });

    it('should throw error for empty payment method id', () => {
      expect(() => new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        '',
        transactionData.type
      )).toThrow('Payment method ID cannot be empty');
    });

    it('should throw error for manual transaction with source id', () => {
      expect(() => new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.MANUAL,
        'should-not-have-source-id'
      )).toThrow('Manual transactions cannot have a source ID');
    });

    it('should throw error for installment transaction without source id', () => {
      expect(() => new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.INSTALLMENT,
        null
      )).toThrow('installment transactions must have a source ID');
    });

    it('should throw error for subscription transaction without source id', () => {
      expect(() => new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.SUBSCRIPTION,
        null
      )).toThrow('subscription transactions must have a source ID');
    });
  });

  describe('getters', () => {
    let transaction: Transaction;

    beforeEach(() => {
      transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description
      );
    });

    it('should return immutable date objects', () => {
      const date1 = transaction.date;
      const date2 = transaction.date;
      
      expect(date1).toEqual(date2);
      expect(date1).not.toBe(date2); // Different instances
      
      date1.setFullYear(2025);
      expect(transaction.date.getFullYear()).toBe(2024); // Original unchanged
    });

    it('should return immutable created and updated date objects', () => {
      const createdAt1 = transaction.createdAt;
      const createdAt2 = transaction.createdAt;
      const originalYear = createdAt1.getFullYear();
      
      expect(createdAt1).toEqual(createdAt2);
      expect(createdAt1).not.toBe(createdAt2);
      
      createdAt1.setFullYear(2025);
      expect(transaction.createdAt.getFullYear()).toBe(originalYear); // Original unchanged
    });
  });

  describe('update methods', () => {
    let transaction: Transaction;

    beforeEach(() => {
      transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description
      );
    });

    describe('updateDate', () => {
      it('should update transaction date successfully', () => {
        const newDate = new Date('2024-02-15');
        const oldUpdatedAt = transaction.updatedAt;

        transaction.updateDate(newDate);

        expect(transaction.date).toEqual(newDate);
        expect(transaction.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should throw error for invalid date', () => {
        expect(() => transaction.updateDate(new Date('invalid')))
          .toThrow('Invalid transaction date');
      });

      it('should throw error for future date beyond limit', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);
        
        expect(() => transaction.updateDate(futureDate))
          .toThrow('Transaction date cannot be more than 1 year in the future');
      });
    });

    describe('updateAmount', () => {
      it('should update transaction amount successfully', () => {
        const newAmount = new Money(15000, 'BRL');
        transaction.updateAmount(newAmount);

        expect(transaction.amount).toEqual(newAmount);
      });

      it('should throw error for zero amount', () => {
        const zeroAmount = new Money(0, 'BRL');
        expect(() => transaction.updateAmount(zeroAmount))
          .toThrow('Transaction amount must be positive');
      });

      it('should throw error for negative amount', () => {
        // Since Money constructor throws for negative amounts, we test that too
        expect(() => {
          const negativeAmount = new Money(-100, 'BRL');
          transaction.updateAmount(negativeAmount);
        }).toThrow('Amount cannot be negative');
      });
    });

    describe('updateCategory', () => {
      it('should update category id successfully', () => {
        const newCategoryId = 'cat-transportation';
        transaction.updateCategory(newCategoryId);

        expect(transaction.categoryId).toBe(newCategoryId);
      });

      it('should throw error for empty category id', () => {
        expect(() => transaction.updateCategory(''))
          .toThrow('Category ID cannot be empty');
      });

      it('should throw error for whitespace-only category id', () => {
        expect(() => transaction.updateCategory('   '))
          .toThrow('Category ID cannot be empty');
      });
    });

    describe('updatePaymentMethod', () => {
      it('should update payment method id successfully', () => {
        const newPaymentMethodId = 'pm-debit';
        transaction.updatePaymentMethod(newPaymentMethodId);

        expect(transaction.paymentMethodId).toBe(newPaymentMethodId);
      });

      it('should throw error for empty payment method id', () => {
        expect(() => transaction.updatePaymentMethod(''))
          .toThrow('Payment method ID cannot be empty');
      });
    });

    describe('updateDescription', () => {
      it('should update description successfully', () => {
        const newDescription = 'Updated description';
        transaction.updateDescription(newDescription);

        expect(transaction.description).toBe(newDescription);
      });

      it('should trim whitespace when updating description', () => {
        transaction.updateDescription('  Updated description  ');

        expect(transaction.description).toBe('Updated description');
      });

      it('should convert empty string to null', () => {
        transaction.updateDescription('');

        expect(transaction.description).toBeNull();
      });

      it('should allow setting description to null', () => {
        transaction.updateDescription(null);

        expect(transaction.description).toBeNull();
      });
    });
  });

  describe('type checking methods', () => {
    it('should identify income transactions correctly', () => {
      const incomeTransaction = new Transaction(
        'txn-income',
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        TransactionType.INCOME
      );

      expect(incomeTransaction.isIncome()).toBe(true);
      expect(incomeTransaction.isExpense()).toBe(false);
    });

    it('should identify expense transactions correctly', () => {
      const expenseTransaction = new Transaction(
        'txn-expense',
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        TransactionType.EXPENSE
      );

      expect(expenseTransaction.isExpense()).toBe(true);
      expect(expenseTransaction.isIncome()).toBe(false);
    });
  });

  describe('source checking methods', () => {
    it('should identify manual transactions correctly', () => {
      const manualTransaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.MANUAL
      );

      expect(manualTransaction.isManual()).toBe(true);
      expect(manualTransaction.isFromInstallment()).toBe(false);
      expect(manualTransaction.isFromSubscription()).toBe(false);
    });

    it('should identify installment transactions correctly', () => {
      const installmentTransaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.INSTALLMENT,
        'installment-123'
      );

      expect(installmentTransaction.isManual()).toBe(false);
      expect(installmentTransaction.isFromInstallment()).toBe(true);
      expect(installmentTransaction.isFromSubscription()).toBe(false);
    });

    it('should identify subscription transactions correctly', () => {
      const subscriptionTransaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        transactionData.description,
        TransactionSource.SUBSCRIPTION,
        'subscription-123'
      );

      expect(subscriptionTransaction.isManual()).toBe(false);
      expect(subscriptionTransaction.isFromInstallment()).toBe(false);
      expect(subscriptionTransaction.isFromSubscription()).toBe(true);
    });
  });

  describe('date filtering methods', () => {
    let transaction: Transaction;

    beforeEach(() => {
      // Transaction on 2024-01-15
      transaction = new Transaction(
        transactionData.id,
        new Date('2024-01-15'),
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );
    });

    describe('isInMonth', () => {
      it('should return true for correct month', () => {
        expect(transaction.isInMonth(2024, 1)).toBe(true);
      });

      it('should return false for different month', () => {
        expect(transaction.isInMonth(2024, 2)).toBe(false);
      });

      it('should return false for different year', () => {
        expect(transaction.isInMonth(2023, 1)).toBe(false);
      });

      it('should handle December correctly', () => {
        const decemberTransaction = new Transaction(
          'txn-dec',
          new Date('2024-12-25'),
          transactionData.amount,
          transactionData.categoryId,
          transactionData.paymentMethodId,
          transactionData.type
        );

        expect(decemberTransaction.isInMonth(2024, 12)).toBe(true);
        expect(decemberTransaction.isInMonth(2024, 11)).toBe(false);
      });
    });

    describe('isInYear', () => {
      it('should return true for correct year', () => {
        expect(transaction.isInYear(2024)).toBe(true);
      });

      it('should return false for different year', () => {
        expect(transaction.isInYear(2023)).toBe(false);
        expect(transaction.isInYear(2025)).toBe(false);
      });
    });

    describe('isInDateRange', () => {
      it('should return true when date is within range', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');

        expect(transaction.isInDateRange(startDate, endDate)).toBe(true);
      });

      it('should return true when date equals start date', () => {
        const startDate = new Date('2024-01-15');
        const endDate = new Date('2024-01-31');

        expect(transaction.isInDateRange(startDate, endDate)).toBe(true);
      });

      it('should return true when date equals end date', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-15');

        expect(transaction.isInDateRange(startDate, endDate)).toBe(true);
      });

      it('should return false when date is before range', () => {
        const startDate = new Date('2024-01-16');
        const endDate = new Date('2024-01-31');

        expect(transaction.isInDateRange(startDate, endDate)).toBe(false);
      });

      it('should return false when date is after range', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-14');

        expect(transaction.isInDateRange(startDate, endDate)).toBe(false);
      });
    });
  });

  describe('equals', () => {
    it('should return true for transactions with same id', () => {
      const transaction1 = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );
      const transaction2 = new Transaction(
        transactionData.id,
        new Date('2024-02-01'), // Different date
        new Money(20000, 'BRL'), // Different amount
        'different-category',
        'different-payment',
        TransactionType.INCOME
      );

      expect(transaction1.equals(transaction2)).toBe(true);
    });

    it('should return false for transactions with different ids', () => {
      const transaction1 = new Transaction(
        'txn-1',
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );
      const transaction2 = new Transaction(
        'txn-2',
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );

      expect(transaction1.equals(transaction2)).toBe(false);
    });
  });

  describe('static factory methods', () => {
    describe('createManual', () => {
      it('should create a manual transaction with description', () => {
        const transaction = Transaction.createManual(
          transactionData.id,
          transactionData.date,
          transactionData.amount,
          transactionData.categoryId,
          transactionData.paymentMethodId,
          transactionData.type,
          transactionData.description
        );

        expect(transaction.id).toBe(transactionData.id);
        expect(transaction.source).toBe(TransactionSource.MANUAL);
        expect(transaction.sourceId).toBeNull();
        expect(transaction.description).toBe(transactionData.description);
        expect(transaction.isManual()).toBe(true);
      });

      it('should create a manual transaction without description', () => {
        const transaction = Transaction.createManual(
          transactionData.id,
          transactionData.date,
          transactionData.amount,
          transactionData.categoryId,
          transactionData.paymentMethodId,
          transactionData.type
        );

        expect(transaction.description).toBeNull();
        expect(transaction.source).toBe(TransactionSource.MANUAL);
        expect(transaction.sourceId).toBeNull();
      });
    });

    describe('createFromInstallment', () => {
      it('should create an installment transaction', () => {
        const installmentPlanId = 'installment-123';
        const transaction = Transaction.createFromInstallment(
          transactionData.id,
          transactionData.date,
          transactionData.amount,
          transactionData.categoryId,
          transactionData.paymentMethodId,
          transactionData.type,
          installmentPlanId,
          transactionData.description
        );

        expect(transaction.source).toBe(TransactionSource.INSTALLMENT);
        expect(transaction.sourceId).toBe(installmentPlanId);
        expect(transaction.isFromInstallment()).toBe(true);
        expect(transaction.description).toBe(transactionData.description);
      });

      it('should create an installment transaction without description', () => {
        const installmentPlanId = 'installment-123';
        const transaction = Transaction.createFromInstallment(
          transactionData.id,
          transactionData.date,
          transactionData.amount,
          transactionData.categoryId,
          transactionData.paymentMethodId,
          transactionData.type,
          installmentPlanId
        );

        expect(transaction.description).toBeNull();
        expect(transaction.source).toBe(TransactionSource.INSTALLMENT);
        expect(transaction.sourceId).toBe(installmentPlanId);
      });
    });

    describe('createFromSubscription', () => {
      it('should create a subscription transaction', () => {
        const subscriptionId = 'subscription-123';
        const transaction = Transaction.createFromSubscription(
          transactionData.id,
          transactionData.date,
          transactionData.amount,
          transactionData.categoryId,
          transactionData.paymentMethodId,
          transactionData.type,
          subscriptionId,
          transactionData.description
        );

        expect(transaction.source).toBe(TransactionSource.SUBSCRIPTION);
        expect(transaction.sourceId).toBe(subscriptionId);
        expect(transaction.isFromSubscription()).toBe(true);
        expect(transaction.description).toBe(transactionData.description);
      });

      it('should create a subscription transaction without description', () => {
        const subscriptionId = 'subscription-123';
        const transaction = Transaction.createFromSubscription(
          transactionData.id,
          transactionData.date,
          transactionData.amount,
          transactionData.categoryId,
          transactionData.paymentMethodId,
          transactionData.type,
          subscriptionId
        );

        expect(transaction.description).toBeNull();
        expect(transaction.source).toBe(TransactionSource.SUBSCRIPTION);
        expect(transaction.sourceId).toBe(subscriptionId);
      });
    });
  });

  describe('TransactionSource enum', () => {
    it('should have correct enum values', () => {
      expect(TransactionSource.MANUAL).toBe('manual');
      expect(TransactionSource.INSTALLMENT).toBe('installment');
      expect(TransactionSource.SUBSCRIPTION).toBe('subscription');
    });

    it('should only have three values', () => {
      const values = Object.values(TransactionSource);
      expect(values).toHaveLength(3);
      expect(values).toContain('manual');
      expect(values).toContain('installment');
      expect(values).toContain('subscription');
    });
  });

  describe('edge cases and validation', () => {
    it('should handle transactions on leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      const transaction = new Transaction(
        transactionData.id,
        leapYearDate,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );

      expect(transaction.date).toEqual(leapYearDate);
      expect(transaction.isInMonth(2024, 2)).toBe(true);
    });

    it('should handle special characters in description', () => {
      const specialDescription = 'Café & Dining (50% off) - $10 discount!';
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        specialDescription
      );

      expect(transaction.description).toBe(specialDescription);
    });

    it('should handle unicode characters in description', () => {
      const unicodeDescription = '🍔 Food & Dining 🍕 - Lunch with friends 😊';
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type,
        unicodeDescription
      );

      expect(transaction.description).toBe(unicodeDescription);
    });

    it('should handle very large amounts', () => {
      const largeAmount = new Money(999999999.99, 'BRL');
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        largeAmount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );

      expect(transaction.amount.amount).toBe(999999999.99);
    });

    it('should handle date exactly 1 year in the future', () => {
      const now = new Date();
      const oneYearFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      const transaction = new Transaction(
        transactionData.id,
        oneYearFuture,
        transactionData.amount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );

      expect(transaction.date).toEqual(oneYearFuture);
    });

    it('should handle different currencies', () => {
      const usdAmount = new Money(10000, 'USD');
      const transaction = new Transaction(
        transactionData.id,
        transactionData.date,
        usdAmount,
        transactionData.categoryId,
        transactionData.paymentMethodId,
        transactionData.type
      );

      expect(transaction.amount.currency).toBe('USD');
      expect(transaction.amount.amount).toBe(10000);
    });
  });
}); 