import { describe, it, expect } from 'vitest';
import { TransactionType, TransactionTypeVO } from '@/domain/value-objects/transaction-type.js';

describe('TransactionType Value Object', () => {
  describe('constructor', () => {
    it('should create transaction type with valid income value', () => {
      const transactionType = new TransactionTypeVO('income');
      
      expect(transactionType.value).toBe(TransactionType.INCOME);
    });

    it('should create transaction type with valid expense value', () => {
      const transactionType = new TransactionTypeVO('expense');
      
      expect(transactionType.value).toBe(TransactionType.EXPENSE);
    });

    it('should handle uppercase input', () => {
      const transactionType = new TransactionTypeVO('INCOME');
      
      expect(transactionType.value).toBe(TransactionType.INCOME);
    });

    it('should handle mixed case input', () => {
      const transactionType = new TransactionTypeVO('ExPeNsE');
      
      expect(transactionType.value).toBe(TransactionType.EXPENSE);
    });

    it('should throw error for invalid transaction type', () => {
      expect(() => new TransactionTypeVO('invalid'))
        .toThrow('Invalid transaction type: invalid');
    });

    it('should throw error for empty string', () => {
      expect(() => new TransactionTypeVO(''))
        .toThrow('Invalid transaction type: ');
    });

    it('should throw error for whitespace only', () => {
      expect(() => new TransactionTypeVO('   '))
        .toThrow('Invalid transaction type:    ');
    });
  });

  describe('isIncome', () => {
    it('should return true for income type', () => {
      const transactionType = new TransactionTypeVO('income');
      
      expect(transactionType.isIncome()).toBe(true);
    });

    it('should return false for expense type', () => {
      const transactionType = new TransactionTypeVO('expense');
      
      expect(transactionType.isIncome()).toBe(false);
    });
  });

  describe('isExpense', () => {
    it('should return true for expense type', () => {
      const transactionType = new TransactionTypeVO('expense');
      
      expect(transactionType.isExpense()).toBe(true);
    });

    it('should return false for income type', () => {
      const transactionType = new TransactionTypeVO('income');
      
      expect(transactionType.isExpense()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same transaction types', () => {
      const type1 = new TransactionTypeVO('income');
      const type2 = new TransactionTypeVO('income');
      
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different transaction types', () => {
      const type1 = new TransactionTypeVO('income');
      const type2 = new TransactionTypeVO('expense');
      
      expect(type1.equals(type2)).toBe(false);
    });

    it('should handle case insensitive comparison', () => {
      const type1 = new TransactionTypeVO('income');
      const type2 = new TransactionTypeVO('INCOME');
      
      expect(type1.equals(type2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return string representation for income', () => {
      const transactionType = new TransactionTypeVO('income');
      
      expect(transactionType.toString()).toBe('income');
    });

    it('should return string representation for expense', () => {
      const transactionType = new TransactionTypeVO('expense');
      
      expect(transactionType.toString()).toBe('expense');
    });
  });

  describe('static factory methods', () => {
    describe('income', () => {
      it('should create income transaction type', () => {
        const transactionType = TransactionTypeVO.income();
        
        expect(transactionType.value).toBe(TransactionType.INCOME);
        expect(transactionType.isIncome()).toBe(true);
        expect(transactionType.isExpense()).toBe(false);
      });
    });

    describe('expense', () => {
      it('should create expense transaction type', () => {
        const transactionType = TransactionTypeVO.expense();
        
        expect(transactionType.value).toBe(TransactionType.EXPENSE);
        expect(transactionType.isExpense()).toBe(true);
        expect(transactionType.isIncome()).toBe(false);
      });
    });
  });

  describe('TransactionType enum', () => {
    it('should have correct enum values', () => {
      expect(TransactionType.INCOME).toBe('income');
      expect(TransactionType.EXPENSE).toBe('expense');
    });

    it('should only have two values', () => {
      const values = Object.values(TransactionType);
      expect(values).toHaveLength(2);
      expect(values).toContain('income');
      expect(values).toContain('expense');
    });
  });
}); 