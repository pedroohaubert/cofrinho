import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSQLSavingsBucketRepository } from '@/infrastructure/database/repositories/postgresql-savings-bucket.repository';
import { SavingsBucket } from '@/domain/entities/savings-bucket';
import { Money } from '@/domain/value-objects/money';
import { randomUUID } from 'crypto';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL environment variable is not set. Please configure it for integration tests.");
}

const testSql = postgres(TEST_DATABASE_URL);

describe('PostgreSQLSavingsBucketRepository Integration Tests', () => {
  let repository: PostgreSQLSavingsBucketRepository;

  beforeAll(async () => {
    repository = new PostgreSQLSavingsBucketRepository(testSql);
    console.log("Opened test database connection for SavingsBucketRepository.");
  });

  afterAll(async () => {
    await testSql.end();
    console.log("Closed test database connection for SavingsBucketRepository.");
  });

  beforeEach(async () => {
    await testSql`TRUNCATE TABLE savings_buckets RESTART IDENTITY CASCADE;`;
  });

  // Helper to create SavingsBucket instances for tests
  const createTestSavingsBucket = (props: {
    id?: string;
    name?: string;
    targetAmount?: Money | null;
    currentBalance?: Money;
    description?: string | null;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}): SavingsBucket => {
    const id = props.id || randomUUID();
    const name = props.name || `Test Bucket ${id.substring(0, 8)}`;
    const targetAmount = props.targetAmount === undefined ? new Money(1000, 'BRL') : props.targetAmount;
    const currentBalance = props.currentBalance || new Money(0, 'BRL');
    const description = props.description === undefined ? 'Test description' : props.description;
    const isActive = props.isActive !== undefined ? props.isActive : true;
    const createdAt = props.createdAt || new Date();
    const updatedAt = props.updatedAt || new Date();

    return new SavingsBucket(
      id,
      name,
      targetAmount,
      currentBalance,
      description,
      isActive,
      createdAt,
      updatedAt
    );
  };


  describe('save and findById', () => {
    it('should save a new savings bucket and retrieve it by ID', async () => {
      const bucket = createTestSavingsBucket({
        name: 'Vacation Fund',
        targetAmount: new Money(2000, 'BRL'),
        currentBalance: new Money(500, 'BRL'),
        description: 'For a trip to Europe'
      });
      await repository.save(bucket);

      const found = await repository.findById(bucket.id);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(SavingsBucket);
      expect(found!.id).toBe(bucket.id);
      expect(found!.name).toBe(bucket.name);
      expect(found!.targetAmount?.amount).toBe(bucket.targetAmount?.amount);
      expect(found!.targetAmount?.currency).toBe(bucket.targetAmount?.currency);
      expect(found!.currentBalance.amount).toBe(bucket.currentBalance.amount);
      expect(found!.currentBalance.currency).toBe(bucket.currentBalance.currency);
      expect(found!.description).toBe(bucket.description);
      expect(found!.isActive).toBe(bucket.isActive);
      expect(found!.createdAt.toISOString()).toBe(bucket.createdAt.toISOString());
      // For save, updatedAt should be the same as input
      expect(found!.updatedAt.toISOString()).toBe(bucket.updatedAt.toISOString());
    });

    it('should save and retrieve a bucket with null targetAmount and null description', async () => {
      const bucket = createTestSavingsBucket({
        targetAmount: null,
        description: null,
        currentBalance: new Money(100, 'BRL')
      });
      await repository.save(bucket);
      const found = await repository.findById(bucket.id);
      expect(found).not.toBeNull();
      expect(found!.targetAmount).toBeNull();
      expect(found!.description).toBeNull();
      expect(found!.currentBalance.amount).toBe(100);
    });

    it('should return null if bucket with given ID does not exist', async () => {
      const found = await repository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all savings buckets ordered by name', async () => {
      const bucket1 = createTestSavingsBucket({ name: 'House Downpayment' });
      const bucket2 = createTestSavingsBucket({ name: 'Emergency Fund' });
      const bucket3 = createTestSavingsBucket({ name: 'New Car' });
      await repository.save(bucket1);
      await repository.save(bucket2);
      await repository.save(bucket3);

      const buckets = await repository.findAll();
      expect(buckets).toHaveLength(3);
      expect(buckets[0].name).toBe('Emergency Fund'); // E
      expect(buckets[1].name).toBe('House Downpayment'); // H
      expect(buckets[2].name).toBe('New Car'); // N
    });
  });

  describe('update', () => {
    it('should update an existing savings bucket', async () => {
      const bucket = createTestSavingsBucket({ name: 'Initial Name', currentBalance: new Money(100, 'BRL') });
      await repository.save(bucket);
      const initialUpdatedAt = (await repository.findById(bucket.id))!.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure updatedAt changes

      bucket.updateName('Updated Name');
      bucket.updateDescription('Updated Description');
      bucket.updateTargetAmount(new Money(5000, 'BRL'));
      bucket.addFunds(new Money(200, 'BRL')); // currentBalance is now 300
      bucket.deactivate();

      await repository.update(bucket);

      const updatedBucket = await repository.findById(bucket.id);
      expect(updatedBucket).not.toBeNull();
      expect(updatedBucket!.name).toBe('Updated Name');
      expect(updatedBucket!.description).toBe('Updated Description');
      expect(updatedBucket!.targetAmount?.amount).toBe(5000);
      expect(updatedBucket!.currentBalance.amount).toBe(300);
      expect(updatedBucket!.isActive).toBe(false);
      expect(updatedBucket!.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete a savings bucket', async () => {
      const bucket = createTestSavingsBucket();
      await repository.save(bucket);
      await repository.delete(bucket.id);
      const found = await repository.findById(bucket.id);
      expect(found).toBeNull();
    });
  });

  describe('findActiveBuckets', () => {
    it('should return only active savings buckets', async () => {
      const activeBucket = createTestSavingsBucket({ name: 'Active One', isActive: true });
      const inactiveBucket = createTestSavingsBucket({ name: 'Inactive One', isActive: false });
      await repository.save(activeBucket);
      await repository.save(inactiveBucket);

      const activeBuckets = await repository.findActiveBuckets();
      expect(activeBuckets).toHaveLength(1);
      expect(activeBuckets[0].id).toBe(activeBucket.id);
    });
  });

  describe('findInactiveBuckets', () => {
    it('should return only inactive savings buckets', async () => {
      const activeBucket = createTestSavingsBucket({ name: 'Active Two', isActive: true });
      const inactiveBucket = createTestSavingsBucket({ name: 'Inactive Two', isActive: false });
      await repository.save(activeBucket);
      await repository.save(inactiveBucket);

      const inactiveBuckets = await repository.findInactiveBuckets();
      expect(inactiveBuckets).toHaveLength(1);
      expect(inactiveBuckets[0].id).toBe(inactiveBucket.id);
    });
  });

  describe('findByName', () => {
    it('should find an active bucket by its name (case-insensitive)', async () => {
      const bucket = createTestSavingsBucket({ name: 'Holiday Fund' });
      await repository.save(bucket);

      const found = await repository.findByName('holiday fund');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(bucket.id);
    });

    it('should return null if no active bucket matches the name', async () => {
      const bucket = createTestSavingsBucket({ name: 'Ghost Fund', isActive: false });
      await repository.save(bucket);
      const found = await repository.findByName('Ghost Fund');
      expect(found).toBeNull();
    });
  });

  describe('findBucketsWithTargets', () => {
    it('should return active buckets that have a target amount', async () => {
      const withTarget = createTestSavingsBucket({ name: 'Targeted', targetAmount: new Money(100) });
      const noTarget = createTestSavingsBucket({ name: 'Untargeted', targetAmount: null });
      const inactiveWithTarget = createTestSavingsBucket({ name: 'Inactive Targeted', targetAmount: new Money(100), isActive: false });

      await repository.save(withTarget);
      await repository.save(noTarget);
      await repository.save(inactiveWithTarget);

      const buckets = await repository.findBucketsWithTargets();
      expect(buckets).toHaveLength(1);
      expect(buckets[0].id).toBe(withTarget.id);
    });
  });

  describe('findBucketsWithoutTargets', () => {
    it('should return active buckets that do not have a target amount', async () => {
      const withTarget = createTestSavingsBucket({ name: 'Targeted One', targetAmount: new Money(100) });
      const noTarget = createTestSavingsBucket({ name: 'Untargeted One', targetAmount: null });
      const inactiveNoTarget = createTestSavingsBucket({ name: 'Inactive Untargeted', targetAmount: null, isActive: false });

      await repository.save(withTarget);
      await repository.save(noTarget);
      await repository.save(inactiveNoTarget);

      const buckets = await repository.findBucketsWithoutTargets();
      expect(buckets).toHaveLength(1);
      expect(buckets[0].id).toBe(noTarget.id);
    });
  });

  describe('findTargetReachedBuckets', () => {
    it('should return active buckets where current balance is greater than or equal to target amount', async () => {
      const targetReached = createTestSavingsBucket({ name: 'Reached', targetAmount: new Money(500), currentBalance: new Money(550) });
      const targetNotReached = createTestSavingsBucket({ name: 'Not Reached', targetAmount: new Money(500), currentBalance: new Money(450) });
      const targetReachedInactive = createTestSavingsBucket({ name: 'Reached Inactive', targetAmount: new Money(500), currentBalance: new Money(500), isActive: false });
      const noTargetBucket = createTestSavingsBucket({ name: 'No Target Reached', targetAmount: null, currentBalance: new Money(1000) });

      await repository.save(targetReached);
      await repository.save(targetNotReached);
      await repository.save(targetReachedInactive);
      await repository.save(noTargetBucket);

      const buckets = await repository.findTargetReachedBuckets();
      expect(buckets).toHaveLength(1);
      expect(buckets[0].id).toBe(targetReached.id);
    });
  });
});
