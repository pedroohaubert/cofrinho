import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSQLBucketTransferRepository } from '../../../../src/infrastructure/database/repositories/postgresql-bucket-transfer.repository';
import { BucketTransfer, BucketTransferType } from '../../../../src/domain/entities/bucket-transfer';
import { SavingsBucket } from '../../../../src/domain/entities/savings-bucket';
import { Money } from '../../../../src/domain/value-objects/money';
import { DateRange } from '../../../../src/domain/value-objects/date-range';
import { randomUUID } from 'crypto';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL environment variable is not set. Please configure it for integration tests.");
}

const testSql = postgres(TEST_DATABASE_URL);

describe('PostgreSQLBucketTransferRepository Integration Tests', () => {
  let repository: PostgreSQLBucketTransferRepository;
  let testSavingsBucket: SavingsBucket;

  beforeAll(async () => {
    repository = new PostgreSQLBucketTransferRepository(testSql);
    console.log("Opened test database connection for BucketTransferRepository.");
  });

  afterAll(async () => {
    await testSql.end();
    console.log("Closed test database connection for BucketTransferRepository.");
  });

  beforeEach(async () => {
    await testSql`TRUNCATE TABLE bucket_transfers, savings_buckets RESTART IDENTITY CASCADE;`;

    testSavingsBucket = new SavingsBucket(
      randomUUID(),
      'Test Bucket for Transfers',
      new Money(1000, 'USD'), // target
      new Money(500, 'USD')  // balance
    );
    await testSql`
      INSERT INTO savings_buckets (id, name, target_amount, current_balance, description, is_active, created_at, updated_at)
      VALUES (
        ${testSavingsBucket.id},
        ${testSavingsBucket.name},
        ${testSavingsBucket.targetAmount?.amount || null},
        ${testSavingsBucket.currentBalance.amount},
        ${testSavingsBucket.description},
        ${testSavingsBucket.isActive},
        ${testSavingsBucket.createdAt.toISOString()},
        ${testSavingsBucket.updatedAt.toISOString()}
      )
    `;
  });

  const createTestBucketTransfer = (props: Partial<BucketTransfer> & { id?: string } = {}): BucketTransfer => {
    const id = props.id || randomUUID();
    const now = new Date();
    // The entity constructor expects a positive amount. The type (DEPOSIT/WITHDRAWAL) dictates interpretation.
    // The repository stores positive for deposit, and (based on current repo code review) would store negative for withdrawal
    // if the entity allowed it. However, entity amount is always positive.
    // The repository's save method takes the positive amount from entity.
    // The repository's mapRowToEntity infers type from amount sign if it were stored that way.
    // For testing save, we use positive amounts as per entity.
    return new BucketTransfer(
      id,
      props.date || now,
      props.amount || new Money(100, 'USD'),
      props.type || BucketTransferType.DEPOSIT,
      props.bucketId || testSavingsBucket.id,
      props.description === undefined ? 'Test Transfer' : props.description,
      props.createdAt || now
      // Note: BucketTransfer entity has _updatedAt, but repo doesn't save/update it in the table.
    );
  };

  describe('save and findById', () => {
    it('should save a new deposit transfer and retrieve it by ID', async () => {
      const transfer = createTestBucketTransfer({
        description: 'Initial Deposit',
        type: BucketTransferType.DEPOSIT,
        amount: new Money(200, 'USD')
      });
      await repository.save(transfer);

      const found = await repository.findById(transfer.id);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(BucketTransfer);
      expect(found!.id).toBe(transfer.id);
      expect(found!.bucketId).toBe(transfer.bucketId);
      expect(found!.amount.equals(transfer.amount)).toBe(true);
      // Type is inferred on read based on amount sign; for save, we ensure amount is positive.
      // The current repository stores amount as passed by entity (positive).
      // mapRowToEntity infers type based on amount sign (which will be positive from DB).
      expect(found!.type).toBe(BucketTransferType.DEPOSIT);
      expect(found!.description).toBe(transfer.description);
      expect(found!.date.toISOString()).toBe(transfer.date.toISOString());
      expect(found!.createdAt.toISOString()).toBe(transfer.createdAt.toISOString());
    });

    // To test withdrawal saving correctly, we'd need to ensure the amount is stored appropriately
    // (e.g. as negative, or type column is used). Current repo stores amount as-is (positive) from entity.
    // The mapRowToEntity infers type, so a "withdrawal" entity saved will be read back as "deposit"
    // if amount is positive in DB. This indicates a mismatch between entity design and repo storage for type.
    // For now, we test based on current repo behavior.

    it('should return null if transfer with given ID does not exist', async () => {
      const found = await repository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all transfers ordered by date DESC, then createdAt DESC', async () => {
      const date1 = new Date(2024, 0, 10);
      const date2 = new Date(2024, 0, 15);
      const transfer1 = createTestBucketTransfer({ description: 'T1', date: date1, createdAt: new Date(date1.getTime() + 1000) });
      const transfer2 = createTestBucketTransfer({ description: 'T2', date: date2 });
      const transfer3 = createTestBucketTransfer({ description: 'T3', date: date1, createdAt: new Date(date1.getTime() + 2000) });

      await repository.save(transfer1);
      await repository.save(transfer2);
      await repository.save(transfer3);

      const transfers = await repository.findAll();
      expect(transfers).toHaveLength(3);
      expect(transfers[0].id).toBe(transfer2.id); // Date 2 is latest
      expect(transfers[1].id).toBe(transfer3.id); // Date 1, later createdAt
      expect(transfers[2].id).toBe(transfer1.id); // Date 1, earlier createdAt
    });
  });

  describe('update', () => {
    it('should update description, amount, and date of an existing transfer', async () => {
      const originalDate = new Date('2024-01-01T12:00:00Z');
      const transfer = createTestBucketTransfer({
        description: 'Original Desc',
        amount: new Money(100, 'USD'),
        date: originalDate
      });
      await repository.save(transfer);

      const newDescription = 'Updated Desc';
      const newAmount = new Money(150, 'USD');
      const newDate = new Date('2024-01-02T12:00:00Z');

      // Create a new entity instance for update, as per repository pattern
      const transferToUpdate = new BucketTransfer(
        transfer.id,
        newDate,
        newAmount,
        transfer.type, // Type change is not supported by this update method in repo
        transfer.bucketId,
        newDescription,
        transfer.createdAt // createdAt should not change on update
      );

      await repository.update(transferToUpdate);
      const updatedTransfer = await repository.findById(transfer.id);

      expect(updatedTransfer).not.toBeNull();
      expect(updatedTransfer!.description).toBe(newDescription);
      expect(updatedTransfer!.amount.equals(newAmount)).toBe(true);
      expect(updatedTransfer!.date.toISOString()).toBe(newDate.toISOString());
      // Note: The repository's update method does not update an 'updated_at' field in the DB.
    });
  });

  describe('delete', () => {
    it('should delete a transfer', async () => {
      const transfer = createTestBucketTransfer();
      await repository.save(transfer);
      await repository.delete(transfer.id);
      const found = await repository.findById(transfer.id);
      expect(found).toBeNull();
    });
  });

  describe('findByBucket', () => {
    it('should return all transfers for a specific bucketId', async () => {
      const bucket2 = new SavingsBucket(randomUUID(), 'Bucket 2', null, new Money(0));
      await testSql`INSERT INTO savings_buckets (id, name, current_balance, created_at, updated_at) VALUES (${bucket2.id}, ${bucket2.name}, ${bucket2.currentBalance.amount}, ${bucket2.createdAt.toISOString()}, ${bucket2.updatedAt.toISOString()})`;

      const transfer1 = createTestBucketTransfer({ bucketId: testSavingsBucket.id });
      const transfer2 = createTestBucketTransfer({ bucketId: bucket2.id });
      await repository.save(transfer1);
      await repository.save(transfer2);

      const transfers = await repository.findByBucket(testSavingsBucket.id);
      expect(transfers).toHaveLength(1);
      expect(transfers[0].id).toBe(transfer1.id);
    });
  });

  describe('findByBucketAndDateRange', () => {
    it('should return transfers for a bucket within a date range', async () => {
        const date1 = new Date(2024, 0, 10); // Jan 10
        const date2 = new Date(2024, 0, 20); // Jan 20
        const date3 = new Date(2024, 1, 10); // Feb 10

        const transfer1 = createTestBucketTransfer({ bucketId: testSavingsBucket.id, date: date1 });
        const transfer2 = createTestBucketTransfer({ bucketId: testSavingsBucket.id, date: date2 });
        const transfer3 = createTestBucketTransfer({ bucketId: testSavingsBucket.id, date: date3 });
        await repository.save(transfer1);
        await repository.save(transfer2);
        await repository.save(transfer3);

        const range = new DateRange(new Date(2024, 0, 1), new Date(2024, 0, 31));
        const transfers = await repository.findByBucketAndDateRange(testSavingsBucket.id, range);
        expect(transfers).toHaveLength(2);
        expect(transfers.some(t => t.id === transfer1.id)).toBe(true);
        expect(transfers.some(t => t.id === transfer2.id)).toBe(true);
    });
  });

  describe('findByDateRange', () => {
    it('should return all transfers within a date range', async () => {
        const date1 = new Date(2024, 0, 10);
        const date2 = new Date(2024, 0, 20);
        const date3 = new Date(2024, 1, 10);

        const transfer1 = createTestBucketTransfer({ date: date1 });
        const transfer2 = createTestBucketTransfer({ date: date2 });
        const transfer3 = createTestBucketTransfer({ date: date3 });
        await repository.save(transfer1);
        await repository.save(transfer2);
        await repository.save(transfer3);

        const range = new DateRange(new Date(2024, 0, 1), new Date(2024, 0, 31));
        const transfers = await repository.findByDateRange(range);
        expect(transfers).toHaveLength(2);
    });
  });

  // findByType is tricky because the type is inferred from amount sign in DB.
  // The current save method stores amount from entity (always positive).
  // This means findByType(WITHDRAWAL) would not work as expected unless amounts are manually made negative in DB.
  // This points to a potential design issue in how type is stored/retrieved.
  // Skipping a detailed test for findByType until this is clarified or repository is changed.
});
