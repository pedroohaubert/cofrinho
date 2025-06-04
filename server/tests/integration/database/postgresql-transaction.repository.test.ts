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

if (!TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL environment variable is not set. Please configure it for integration tests.");
}

// Create a dedicated SQL connection for tests
const testSql = postgres(TEST_DATABASE_URL);

describe('PostgreSQLTransactionRepository Integration Tests', () => {
  let repository: PostgreSQLTransactionRepository;

  // Placeholder data for foreign key constraints
  let testCategory: Category;
  let testPaymentMethod: PaymentMethod;

  beforeAll(async () => {
    repository = new PostgreSQLTransactionRepository();
    console.log("Opened test database connection.");
  });

  afterAll(async () => {
    await testSql.end();
    console.log("Closed test database connection.");
  });

  beforeEach(async () => {
    await testSql`TRUNCATE TABLE transactions, categories, payment_methods RESTART IDENTITY CASCADE;`;

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
      VALUES (${testCategory.id}, ${testCategory.name}, ${testCategory.type.toString()}, ${testCategory.color}, ${testCategory.isActive}, ${testCategory.createdAt.toISOString()}, ${testCategory.updatedAt.toISOString()})
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
      VALUES (${testPaymentMethod.id}, ${testPaymentMethod.name}, ${testPaymentMethod.type.toString()}, ${testPaymentMethod.isActive}, ${testPaymentMethod.createdAt.toISOString()}, ${testPaymentMethod.updatedAt.toISOString()})
    `;
  });

  describe('save and findById', () => {
    it('should save a new transaction and retrieve it by ID', async () => {
      const transactionId = randomUUID();
      const transactionDate = new Date(Date.UTC(2024, 6, 28));
      const createdAt = new Date(Date.UTC(2024, 6, 28));
      const updatedAt = new Date(Date.UTC(2024, 6, 28));

      const transaction = new Transaction(
        transactionId,
        transactionDate,
        new Money(100.50, 'BRL'), // Explicitly BRL
        testCategory.id,
        testPaymentMethod.id,
        TransactionType.EXPENSE,
        'Test transaction description',
        TransactionSource.MANUAL,
        null,
        createdAt,
        updatedAt
      );

      await repository.save(transaction);
      const found = await repository.findById(transaction.id);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(Transaction);
      expect(found!.id).toBe(transaction.id);
      expect(found!.date.toISOString()).toBe(transaction.date.toISOString());
      expect(found!.amount.amount).toBe(transaction.amount.amount);
      expect(found!.amount.currency).toBe('BRL'); // Assert BRL
      expect(found!.categoryId).toBe(transaction.categoryId);
      expect(found!.paymentMethodId).toBe(transaction.paymentMethodId);
      expect(found!.type).toBe(transaction.type);
      expect(found!.description).toBe(transaction.description);
      expect(found!.source).toBe(transaction.source);
      expect(found!.sourceId).toBe(transaction.sourceId);

      expect(found!.createdAt.toISOString()).toBe(transaction.createdAt.toISOString());
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
      const initialDate = new Date(Date.UTC(2024, 6, 1)); // Normalized date

      let transaction = new Transaction(
        transactionId,
        initialDate,
        new Money(150.00, 'BRL'), // Explicitly BRL
        testCategory.id,
        testPaymentMethod.id,
        TransactionType.EXPENSE,
        'Initial description',
        TransactionSource.MANUAL,
        null,
        initialDate,
        initialDate
      );
      await repository.save(transaction);

      const originalFetchedTransaction = (await repository.findById(transactionId))!;
      const originalUpdatedAt = originalFetchedTransaction.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const newDescription = 'Updated transaction description';
      const newAmount = new Money(200.75, 'BRL'); // Explicitly BRL

      // Create a new transaction instance for update, or use setters if available
      const fetchedTransaction = (await repository.findById(transactionId))!;

      // Simulate updating fields that the entity allows updating
      // Assuming Transaction entity has methods like updateAmount, updateDescription
      // If not, we'd construct a new Transaction with the old ID and new values for the update call.
      // For this example, let's assume we can update properties on the fetched entity for simplicity of test.
      // In a real CQRS or immutable entity pattern, this might be different.

      const transactionToUpdate = new Transaction(
        fetchedTransaction.id,
        fetchedTransaction.date, // Assuming date is not changed in this update test
        newAmount, // new amount
        fetchedTransaction.categoryId, // Assuming categoryId not changed
        fetchedTransaction.paymentMethodId, // Assuming paymentMethodId not changed
        fetchedTransaction.type, // Assuming type not changed
        newDescription, // new description
        fetchedTransaction.source,
        fetchedTransaction.sourceId,

        fetchedTransaction.createdAt, // createdAt should not change
        new Date() // new updatedAt
      );

      await repository.update(transactionToUpdate);
      const updatedTransaction = await repository.findById(transactionId);

      expect(updatedTransaction).not.toBeNull();
      expect(updatedTransaction!.description).toBe(newDescription);
      expect(updatedTransaction!.amount.amount).toBe(newAmount.amount);
      expect(updatedTransaction!.amount.currency).toBe('BRL'); // Assert BRL
      expect(updatedTransaction!.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete a transaction and it should not be found afterwards', async () => {
      const transaction = new Transaction(
        randomUUID(),
        new Date(Date.UTC(2024, 6, 29)), // Normalized
        new Money(50.00, 'BRL'), // Explicitly BRL
        testCategory.id,
        testPaymentMethod.id,
        TransactionType.EXPENSE,
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
});
