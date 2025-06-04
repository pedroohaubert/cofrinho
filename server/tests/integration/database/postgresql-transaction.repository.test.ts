import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSQLTransactionRepository } from '@/infrastructure/database/repositories/postgresql-transaction.repository';
import { Transaction, TransactionSource } from '@/domain/entities/transaction';
import { Money } from '@/domain/value-objects/money';
import { TransactionType, TransactionTypeVO } from '@/domain/value-objects/transaction-type';
import { Category } from '@/domain/entities/category';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method';
import { randomUUID } from 'crypto';

// Ensure TEST_DATABASE_URL is set from environment variables
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

// Function to check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  if (!TEST_DATABASE_URL) {
    return false;
  }
  
  try {
    const testConnection = postgres(TEST_DATABASE_URL);
    await testConnection`SELECT 1`;
    await testConnection.end();
    return true;
  } catch (error: any) {
    console.warn('Database not available for integration tests:', error?.message || error);
    return false;
  }
}

// Skip all tests if database is not available
const runTests = await isDatabaseAvailable();

describe.skipIf(!runTests)('PostgreSQLTransactionRepository Integration Tests', () => {
  let testSql: postgres.Sql;
  let repository: PostgreSQLTransactionRepository;

  // Placeholder data for foreign key constraints
  let testCategory: Category;
  let testPaymentMethod: PaymentMethod;

  beforeAll(async () => {
    if (!runTests) return;
    
    testSql = postgres(TEST_DATABASE_URL!);
    repository = new PostgreSQLTransactionRepository(testSql);
    console.log("Opened test database connection.");
  });

  afterAll(async () => {
    if (!runTests || !testSql) return;
    
    await testSql.end();
    console.log("Closed test database connection.");
  });

  beforeEach(async () => {
    if (!runTests) return;
    
    // Clean relevant tables before each test
    await testSql`TRUNCATE TABLE transactions, categories, payment_methods RESTART IDENTITY CASCADE;`;

    // Insert placeholder category and payment_method
    testCategory = new Category(
      randomUUID(),
      'Test Category',
      TransactionType.EXPENSE,
      '#FF0000',
      true,
      new Date(),
      new Date()
    );
    await testSql`
      INSERT INTO categories (id, name, type, color, is_active, created_at, updated_at)
      VALUES (${testCategory.id}, ${testCategory.name}, ${testCategory.type}, ${testCategory.color}, ${testCategory.isActive}, ${testCategory.createdAt.toISOString()}, ${testCategory.updatedAt.toISOString()})
    `;

    testPaymentMethod = new PaymentMethod(
      randomUUID(),
      'Test Payment Method',
      PaymentMethodType.CASH,
      true,
      new Date(),
      new Date()
    );
    await testSql`
      INSERT INTO payment_methods (id, name, type, is_active, created_at, updated_at)
      VALUES (${testPaymentMethod.id}, ${testPaymentMethod.name}, ${testPaymentMethod.type}, ${testPaymentMethod.isActive}, ${testPaymentMethod.createdAt.toISOString()}, ${testPaymentMethod.updatedAt.toISOString()})
    `;
  });

  describe('save and findById', () => {
    it('should save a new transaction and retrieve it by ID', async () => {
      const transactionId = randomUUID();
      const transactionDate = new Date('2024-07-28T10:00:00.000Z');
      const createdAt = new Date('2024-07-28T10:00:00.000Z');
      const updatedAt = new Date('2024-07-28T10:00:00.000Z');

      const transaction = new Transaction(
        transactionId,
        transactionDate,
        new Money(100.50, 'BRL'),
        testCategory.id,
        testPaymentMethod.id,
        new TransactionTypeVO(TransactionType.EXPENSE),
        'Test transaction description',
        TransactionSource.MANUAL,
        null, // sourceId for manual
        true, // isActive
        createdAt,
        updatedAt
      );

      await repository.save(transaction);
      const found = await repository.findById(transaction.id);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(Transaction);

      // Deep equality check for all relevant properties
      expect(found!.id).toBe(transaction.id);
      expect(found!.date.toISOString()).toBe(transaction.date.toISOString());
      expect(found!.amount.amount).toBe(transaction.amount.amount);
      expect(found!.amount.currency).toBe(transaction.amount.currency);
      expect(found!.categoryId).toBe(transaction.categoryId);
      expect(found!.paymentMethodId).toBe(transaction.paymentMethodId);
      expect(found!.type.value).toBe(transaction.type.value);
      expect(found!.description).toBe(transaction.description);
      expect(found!.source).toBe(transaction.source);
      expect(found!.sourceId).toBe(transaction.sourceId);
      expect(found!.isActive).toBe(transaction.isActive);
      expect(found!.createdAt.toISOString()).toBe(transaction.createdAt.toISOString());
      // For updatedAt, it might be slightly different due to database precision or triggers.
      // Check if it's close or updated appropriately. For save, it should be same as input.
      expect(found!.updatedAt.toISOString()).toBe(transaction.updatedAt.toISOString());
    });

    it('should return null if transaction with given ID does not exist', async () => {
      const nonExistentId = randomUUID();
      const found = await repository.findById(nonExistentId);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing transaction properties', async () => {
      const transactionId = randomUUID();
      const initialDate = new Date('2024-07-01T10:00:00.000Z');

      let transaction = new Transaction(
        transactionId,
        initialDate,
        new Money(150.00, 'BRL'),
        testCategory.id,
        testPaymentMethod.id,
        new TransactionTypeVO(TransactionType.EXPENSE),
        'Initial description',
        TransactionSource.MANUAL,
        null, true, initialDate, initialDate
      );
      await repository.save(transaction);

      const originalUpdatedAt = transaction.updatedAt;

      // Ensure there's a slight delay for updatedAt comparison if needed,
      // though repository should set its own new updatedAt.
      await new Promise(resolve => setTimeout(resolve, 10));

      const newDescription = 'Updated transaction description';
      const newAmount = new Money(200.75, 'BRL');

      // Re-fetch or re-create the domain object to update
      // For this test, we create a new instance with the same ID and updated values
      // In a real scenario, you'd likely call methods on the fetched 'transaction' instance
      // if it had mutable properties and an update method.
      // Since our entity is largely immutable with setters for specific fields that also update `updatedAt`,
      // we'll simulate fetching and then calling an update.
      // The repository's update method takes a Transaction domain object.

      const fetchedTransaction = (await repository.findById(transactionId))!;
      fetchedTransaction.updateAmount(newAmount); // This updates amount and _updatedAt internally
      fetchedTransaction.updateDescription(newDescription); // This updates description and _updatedAt internally

      await repository.update(fetchedTransaction);

      const updatedTransaction = await repository.findById(transactionId);

      expect(updatedTransaction).not.toBeNull();
      expect(updatedTransaction!.description).toBe(newDescription);
      expect(updatedTransaction!.amount.amount).toBe(newAmount.amount);
      expect(updatedTransaction!.amount.currency).toBe(newAmount.currency);
      expect(updatedTransaction!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete a transaction and it should not be found afterwards', async () => {
      const transaction = new Transaction(
        randomUUID(),
        new Date(),
        new Money(50.00, 'BRL'),
        testCategory.id,
        testPaymentMethod.id,
        new TransactionTypeVO(TransactionType.EXPENSE),
        'To be deleted',
        TransactionSource.MANUAL
      );
      await repository.save(transaction);

      let found = await repository.findById(transaction.id);
      expect(found).not.toBeNull();

      await repository.delete(transaction.id);
      found = await repository.findById(transaction.id);
      expect(found).toBeNull();
    });
  });

  // TODO: Add more tests for other repository methods like findPaginated, findByDateRange etc.
  // For example:
  // describe('findPaginated', () => {
  //   it('should return paginated transactions according to filters', async () => {
  //     // Setup multiple transactions
  //     // ...
  //     // const result = await repository.findPaginated(1, 10, { categoryId: testCategory.id });
  //     // expect(result.items).toHaveLength(N);
  //     // expect(result.totalItems).toBe(M);
  //   });
  // });
});
