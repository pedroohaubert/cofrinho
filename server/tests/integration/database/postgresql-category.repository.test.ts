import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSQLCategoryRepository } from '@/infrastructure/database/repositories/postgresql-category.repository';
import { Category } from '@/domain/entities/category';
import { TransactionType } from '@/domain/value-objects/transaction-type';
import { randomUUID } from 'crypto';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL environment variable is not set. Please configure it for integration tests.");
}

const testSql = postgres(TEST_DATABASE_URL);

describe('PostgreSQLCategoryRepository Integration Tests', () => {
  let repository: PostgreSQLCategoryRepository;

  beforeAll(async () => {
    repository = new PostgreSQLCategoryRepository();
    console.log("Opened test database connection for CategoryRepository.");
  });

  afterAll(async () => {
    await testSql.end();
    console.log("Closed test database connection for CategoryRepository.");
  });

  beforeEach(async () => {
    await testSql`TRUNCATE TABLE categories RESTART IDENTITY CASCADE;`;
  });

  const createTestCategory = (props: Partial<Category> = {}): Category => {
    const id = props.id || randomUUID();
    return new Category(
      id,
      props.name || `Test Category ${id.substring(0, 8)}`,
      props.type || TransactionType.EXPENSE,
      props.color || '#FF0000',
      props.isActive !== undefined ? props.isActive : true,
      props.createdAt || new Date(),
      props.updatedAt || new Date()
    );
  };

  describe('save and findById', () => {
    it('should save a new category and retrieve it by ID', async () => {
      const category = createTestCategory({ name: 'Groceries', type: TransactionType.EXPENSE, color: '#FFA500' });
      await repository.save(category);

      const found = await repository.findById(category.id);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(Category);
      expect(found!.id).toBe(category.id);
      expect(found!.name).toBe(category.name);
      expect(found!.type).toBe(category.type);
      expect(found!.color).toBe(category.color);
      expect(found!.isActive).toBe(category.isActive);
      expect(found!.createdAt.toISOString()).toBe(category.createdAt.toISOString());
      expect(found!.updatedAt.toISOString()).toBe(category.updatedAt.toISOString());
    });

    it('should return null if category with given ID does not exist', async () => {
      const found = await repository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all categories ordered by name', async () => {
      const category1 = createTestCategory({ name: 'Salary', type: TransactionType.INCOME });
      const category2 = createTestCategory({ name: 'Food', type: TransactionType.EXPENSE });
      const category3 = createTestCategory({ name: 'Bills', type: TransactionType.EXPENSE });
      await repository.save(category1);
      await repository.save(category2);
      await repository.save(category3);

      const categories = await repository.findAll();
      expect(categories).toHaveLength(3);
      expect(categories[0].name).toBe('Bills'); // Ordered by name
      expect(categories[1].name).toBe('Food');
      expect(categories[2].name).toBe('Salary');
    });

    it('should return an empty array if no categories exist', async () => {
      const categories = await repository.findAll();
      expect(categories).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update an existing category properties', async () => {
      const category = createTestCategory({ name: 'Old Name', color: '#0000FF' });
      await repository.save(category);

      const initialUpdatedAt = category.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure updatedAt changes

      category.updateName('New Name');
      category.updateColor('#FF00FF');
      category.deactivate();

      await repository.update(category);

      const updatedCategory = await repository.findById(category.id);
      expect(updatedCategory).not.toBeNull();
      expect(updatedCategory!.name).toBe('New Name');
      expect(updatedCategory!.color).toBe('#FF00FF');
      expect(updatedCategory!.isActive).toBe(false);
      expect(updatedCategory!.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete a category and it should not be found afterwards', async () => {
      const category = createTestCategory();
      await repository.save(category);

      let found = await repository.findById(category.id);
      expect(found).not.toBeNull();

      await repository.delete(category.id);
      found = await repository.findById(category.id);
      expect(found).toBeNull();
    });
  });

  describe('findByType', () => {
    it('should return active categories of a specific type ordered by name', async () => {
      const incomeCat1 = createTestCategory({ name: 'Salary', type: TransactionType.INCOME });
      const incomeCat2 = createTestCategory({ name: 'Bonus', type: TransactionType.INCOME });
      const expenseCat = createTestCategory({ name: 'Groceries', type: TransactionType.EXPENSE });
      const inactiveIncomeCat = createTestCategory({ name: 'Old Income', type: TransactionType.INCOME, isActive: false });

      await repository.save(incomeCat1);
      await repository.save(incomeCat2);
      await repository.save(expenseCat);
      await repository.save(inactiveIncomeCat);

      const incomeCategories = await repository.findByType(TransactionType.INCOME);
      expect(incomeCategories).toHaveLength(2);
      expect(incomeCategories[0].name).toBe('Bonus');
      expect(incomeCategories[1].name).toBe('Salary');
      incomeCategories.forEach(cat => {
        expect(cat.type).toBe(TransactionType.INCOME);
        expect(cat.isActive).toBe(true);
      });
    });
  });

  describe('findActiveCategories', () => {
    it('should return only active categories ordered by type, then name', async () => {
      const activeExpense = createTestCategory({ name: 'Food', type: TransactionType.EXPENSE, isActive: true });
      const inactiveExpense = createTestCategory({ name: 'Old Food', type: TransactionType.EXPENSE, isActive: false });
      const activeIncome = createTestCategory({ name: 'Salary', type: TransactionType.INCOME, isActive: true });

      await repository.save(activeExpense);
      await repository.save(inactiveExpense);
      await repository.save(activeIncome);

      const activeCategories = await repository.findActiveCategories();
      expect(activeCategories).toHaveLength(2);
      expect(activeCategories[0].name).toBe('Food');     // EXPENSE ('Food') comes before INCOME ('Salary') when ordered by type ASC, then name ASC
      expect(activeCategories[1].name).toBe('Salary');
      activeCategories.forEach(cat => expect(cat.isActive).toBe(true));
    });
  });

  describe('findInactiveCategories', () => {
    it('should return only inactive categories ordered by name', async () => {
      const activeCat = createTestCategory({ name: 'Active', isActive: true });
      const inactiveCat1 = createTestCategory({ name: 'ZZZ Inactive', isActive: false });
      const inactiveCat2 = createTestCategory({ name: 'AAA Inactive', isActive: false });

      await repository.save(activeCat);
      await repository.save(inactiveCat1);
      await repository.save(inactiveCat2);

      const inactiveCategories = await repository.findInactiveCategories();
      expect(inactiveCategories).toHaveLength(2);
      expect(inactiveCategories[0].name).toBe('AAA Inactive');
      expect(inactiveCategories[1].name).toBe('ZZZ Inactive');
      inactiveCategories.forEach(cat => expect(cat.isActive).toBe(false));
    });
  });

  describe('findByName', () => {
    it('should find an active category by its name (case-insensitive)', async () => {
      const category = createTestCategory({ name: 'Unique Name', type: TransactionType.EXPENSE });
      await repository.save(category);

      const found = await repository.findByName('unique name');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(category.id);
    });

    it('should return null if no active category matches the name', async () => {
      const found = await repository.findByName('NonExistent Name');
      expect(found).toBeNull();
    });

    it('should return null if category with name exists but is inactive', async () => {
      const category = createTestCategory({ name: 'Inactive Category', isActive: false });
      await repository.save(category);

      const found = await repository.findByName('Inactive Category');
      expect(found).toBeNull();
    });
  });

  // exists and existsByName are implicitly tested by other methods,
  // but can have dedicated tests if needed.
});
