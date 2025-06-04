import { describe, it, expect, beforeEach } from 'vitest';
import { Category } from '@/domain/entities/category.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';

describe('Category Entity', () => {
  let categoryData: {
    id: string;
    name: string;
    type: TransactionType;
    color: string;
  };

  beforeEach(() => {
    categoryData = {
      id: 'cat-123',
      name: 'Food & Dining',
      type: TransactionType.EXPENSE,
      color: '#FF5733'
    };
  });

  describe('constructor', () => {
    it('should create a category with all required fields', () => {
      const category = new Category(
        categoryData.id,
        categoryData.name,
        categoryData.type,
        categoryData.color
      );

      expect(category.id).toBe(categoryData.id);
      expect(category.name).toBe(categoryData.name);
      expect(category.type).toBe(categoryData.type);
      expect(category.color).toBe(categoryData.color);
      expect(category.isActive).toBe(true);
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a category without color', () => {
      const category = new Category(
        categoryData.id,
        categoryData.name,
        categoryData.type
      );

      expect(category.color).toBeNull();
    });

    it('should allow setting isActive to false', () => {
      const category = new Category(
        categoryData.id,
        categoryData.name,
        categoryData.type,
        categoryData.color,
        false
      );

      expect(category.isActive).toBe(false);
    });

    it('should accept custom created and updated dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      
      const category = new Category(
        categoryData.id,
        categoryData.name,
        categoryData.type,
        categoryData.color,
        true,
        createdAt,
        updatedAt
      );

      expect(category.createdAt).toEqual(createdAt);
      expect(category.updatedAt).toEqual(updatedAt);
    });

    it('should throw error for empty id', () => {
      expect(() => new Category(
        '',
        categoryData.name,
        categoryData.type
      )).toThrow('Category ID cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(() => new Category(
        '   ',
        categoryData.name,
        categoryData.type
      )).toThrow('Category ID cannot be empty');
    });

    it('should throw error for empty name', () => {
      expect(() => new Category(
        categoryData.id,
        '',
        categoryData.type
      )).toThrow('Category name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => new Category(
        categoryData.id,
        '   ',
        categoryData.type
      )).toThrow('Category name cannot be empty');
    });

    it('should throw error for name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => new Category(
        categoryData.id,
        longName,
        categoryData.type
      )).toThrow('Category name cannot exceed 100 characters');
    });
  });

  describe('updateName', () => {
    let category: Category;

    beforeEach(() => {
      category = new Category(
        categoryData.id,
        categoryData.name,
        categoryData.type,
        categoryData.color
      );
    });

    it('should update category name successfully', () => {
      const newName = 'Updated Category';
      const oldUpdatedAt = category.updatedAt;

      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        category.updateName(newName);

        expect(category.name).toBe(newName);
        expect(category.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
      }, 1);
    });

    it('should trim whitespace when updating name', () => {
      const newName = '  Updated Category  ';
      category.updateName(newName);

      expect(category.name).toBe('Updated Category');
    });

    it('should throw error for empty name', () => {
      expect(() => category.updateName('')).toThrow('Category name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => category.updateName('   ')).toThrow('Category name cannot be empty');
    });

    it('should throw error for name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => category.updateName(longName)).toThrow('Category name cannot exceed 100 characters');
    });
  });

  describe('updateColor', () => {
    let category: Category;

    beforeEach(() => {
      category = new Category(
        categoryData.id,
        categoryData.name,
        categoryData.type,
        categoryData.color
      );
    });

    it('should update category color successfully', () => {
      const newColor = '#00FF00';
      const oldUpdatedAt = category.updatedAt;

      category.updateColor(newColor);

      expect(category.color).toBe(newColor);
      expect(category.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('should allow setting color to null', () => {
      category.updateColor(null);

      expect(category.color).toBeNull();
    });

    it('should trim whitespace when updating color', () => {
      const newColor = '  #FF0000  ';
      category.updateColor(newColor);

      expect(category.color).toBe('#FF0000');
    });

    it('should allow empty string and convert to null', () => {
      category.updateColor('');

      expect(category.color).toBeNull();
    });
  });

  describe('activate and deactivate', () => {
    let category: Category;

    beforeEach(() => {
      category = new Category(
        categoryData.id,
        categoryData.name,
        categoryData.type,
        categoryData.color,
        false // Start as inactive
      );
    });

    it('should activate category', () => {
      category.activate();

      expect(category.isActive).toBe(true);
    });

    it('should deactivate category', () => {
      category.activate(); // First activate
      category.deactivate();

      expect(category.isActive).toBe(false);
    });
  });

  describe('transaction type methods', () => {
    it('should identify income categories correctly', () => {
      const incomeCategory = new Category(
        'cat-income',
        'Salary',
        TransactionType.INCOME
      );

      expect(incomeCategory.isForIncomeTransactions()).toBe(true);
      expect(incomeCategory.isForExpenseTransactions()).toBe(false);
    });

    it('should identify expense categories correctly', () => {
      const expenseCategory = new Category(
        'cat-expense',
        'Food',
        TransactionType.EXPENSE
      );

      expect(expenseCategory.isForExpenseTransactions()).toBe(true);
      expect(expenseCategory.isForIncomeTransactions()).toBe(false);
    });

    it('should check if category can be used for transaction type', () => {
      const incomeCategory = new Category(
        'cat-income',
        'Salary',
        TransactionType.INCOME
      );
      const expenseCategory = new Category(
        'cat-expense',
        'Food',
        TransactionType.EXPENSE
      );

      expect(incomeCategory.canBeUsedForTransactionType(TransactionType.INCOME)).toBe(true);
      expect(incomeCategory.canBeUsedForTransactionType(TransactionType.EXPENSE)).toBe(false);
      
      expect(expenseCategory.canBeUsedForTransactionType(TransactionType.EXPENSE)).toBe(true);
      expect(expenseCategory.canBeUsedForTransactionType(TransactionType.INCOME)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for categories with same id', () => {
      const category1 = new Category(
        categoryData.id,
        categoryData.name,
        categoryData.type
      );
      const category2 = new Category(
        categoryData.id,
        'Different Name',
        TransactionType.INCOME
      );

      expect(category1.equals(category2)).toBe(true);
    });

    it('should return false for categories with different ids', () => {
      const category1 = new Category(
        'cat-1',
        categoryData.name,
        categoryData.type
      );
      const category2 = new Category(
        'cat-2',
        categoryData.name,
        categoryData.type
      );

      expect(category1.equals(category2)).toBe(false);
    });
  });

  describe('static create method', () => {
    it('should create a new category with all properties', () => {
      const category = Category.create(
        categoryData.id,
        categoryData.name,
        categoryData.type,
        categoryData.color
      );

      expect(category.id).toBe(categoryData.id);
      expect(category.name).toBe(categoryData.name);
      expect(category.type).toBe(categoryData.type);
      expect(category.color).toBe(categoryData.color);
      expect(category.isActive).toBe(true);
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a new category without color', () => {
      const category = Category.create(
        categoryData.id,
        categoryData.name,
        categoryData.type
      );

      expect(category.color).toBeNull();
    });
  });

  describe('edge cases and validation', () => {
    it('should handle special characters in name', () => {
      const specialName = 'Café & Dining (50%)';
      const category = new Category(
        categoryData.id,
        specialName,
        categoryData.type
      );

      expect(category.name).toBe(specialName);
    });

    it('should handle unicode characters in name', () => {
      const unicodeName = '🍔 Food & Dining 🍕';
      const category = new Category(
        categoryData.id,
        unicodeName,
        categoryData.type
      );

      expect(category.name).toBe(unicodeName);
    });

    it('should handle name at maximum length', () => {
      const maxLengthName = 'a'.repeat(100);
      const category = new Category(
        categoryData.id,
        maxLengthName,
        categoryData.type
      );

      expect(category.name).toBe(maxLengthName);
      expect(category.name.length).toBe(100);
    });
  });
}); 