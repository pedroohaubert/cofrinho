import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSQLSubscriptionRepository } from '@/infrastructure/database/repositories/postgresql-subscription.repository';
import { Subscription, SubscriptionStatus } from '@/domain/entities/subscription';
import { Category } from '@/domain/entities/category';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method';
import { Money } from '@/domain/value-objects/money';
import { TransactionType } from '@/domain/value-objects/transaction-type';
import { randomUUID } from 'crypto';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL environment variable is not set. Please configure it for integration tests.");
}

const testSql = postgres(TEST_DATABASE_URL);

describe('PostgreSQLSubscriptionRepository Integration Tests', () => {
  let repository: PostgreSQLSubscriptionRepository;
  let testCategory: Category;
  let testPaymentMethod: PaymentMethod;

  // Helper function copied from postgresql-category.repository.test.ts
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

  // Helper function copied from postgresql-payment-method.repository.test.ts
  const createTestPaymentMethod = (props: Partial<PaymentMethod> = {}): PaymentMethod => {
    const id = props.id || randomUUID();
    return new PaymentMethod(
      id,
      props.name || `Test PM ${id.substring(0, 8)}`,
      props.type || PaymentMethodType.CASH,
      props.isActive !== undefined ? props.isActive : true,
      props.createdAt || new Date(),
      props.updatedAt || new Date()
    );
  };

  beforeAll(async () => {
    repository = new PostgreSQLSubscriptionRepository(testSql);
    console.log("Opened test database connection for SubscriptionRepository.");
  });

  afterAll(async () => {
    await testSql.end();
    console.log("Closed test database connection for SubscriptionRepository.");
  });

  beforeEach(async () => {
    await testSql`TRUNCATE TABLE subscriptions, categories, payment_methods RESTART IDENTITY CASCADE;`;

    // Insert placeholder category and payment_method
    testCategory = createTestCategory({name: 'Test Category For Subs', type: TransactionType.EXPENSE});
    await testSql`
      INSERT INTO categories (id, name, type, color, is_active, created_at, updated_at)
      VALUES (${testCategory.id}, ${testCategory.name}, ${testCategory.type.toString()}, ${testCategory.color}, ${testCategory.isActive}, ${testCategory.createdAt.toISOString()}, ${testCategory.updatedAt.toISOString()})
    `;

    testPaymentMethod = createTestPaymentMethod({name: 'Test PM For Subs', type: PaymentMethodType.CREDIT_CARD});
    await testSql`
      INSERT INTO payment_methods (id, name, type, is_active, created_at, updated_at)
      VALUES (${testPaymentMethod.id}, ${testPaymentMethod.name}, ${testPaymentMethod.type.toString()}, ${testPaymentMethod.isActive}, ${testPaymentMethod.createdAt.toISOString()}, ${testPaymentMethod.updatedAt.toISOString()})
    `;
  });

  const createTestSubscription = (props: Partial<Subscription> & { id?: string } = {}): Subscription => {
    const id = props.id || randomUUID();
    const now = new Date();
    return new Subscription(
      id,
      props.name || `Test Sub ${id.substring(0, 8)}`,
      props.monthlyAmount || new Money(10, 'BRL'),
      props.startDate || new Date(now.getFullYear(), now.getMonth(), 1),
      props.categoryId || testCategory.id,
      props.paymentMethodId || testPaymentMethod.id,
      props.endDate === undefined ? null : props.endDate,
      props.status || SubscriptionStatus.ACTIVE,
      props.createdAt || new Date(),
      props.updatedAt || new Date()
    );
  };

  describe('save and findById', () => {
    it('should save a new subscription and retrieve it by ID', async () => {
      const sub = createTestSubscription({ name: 'Netflix', monthlyAmount: new Money(15.99, 'BRL') });
      await repository.save(sub);

      const found = await repository.findById(sub.id);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(Subscription);
      expect(found!.id).toBe(sub.id);
      expect(found!.name).toBe(sub.name);
      expect(found!.monthlyAmount.equals(sub.monthlyAmount)).toBe(true);
      expect(found!.startDate.toISOString()).toBe(sub.startDate.toISOString());
      expect(found!.endDate).toBe(sub.endDate); // null in this case
      expect(found!.categoryId).toBe(sub.categoryId);
      expect(found!.paymentMethodId).toBe(sub.paymentMethodId);
      expect(found!.status).toBe(sub.status);
    });

    it('should return null if subscription with given ID does not exist', async () => {
      const found = await repository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all subscriptions ordered by name', async () => {
      const sub1 = createTestSubscription({ name: 'Spotify' });
      const sub2 = createTestSubscription({ name: 'Adobe CC' });
      const sub3 = createTestSubscription({ name: 'Zoom Pro' });
      await repository.save(sub1);
      await repository.save(sub2);
      await repository.save(sub3);

      const subscriptions = await repository.findAll();
      expect(subscriptions).toHaveLength(3);
      expect(subscriptions[0].name).toBe('Adobe CC');
      expect(subscriptions[1].name).toBe('Spotify');
      expect(subscriptions[2].name).toBe('Zoom Pro');
    });
  });

  describe('update', () => {
    it('should update an existing subscription', async () => {
      const sub = createTestSubscription({ name: 'Old Name', status: SubscriptionStatus.ACTIVE });
      await repository.save(sub);
      const initialUpdatedAt = (await repository.findById(sub.id))!.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      sub.updateName('New Name');
      sub.pause(); // Changes status to PAUSED and updates internal _updatedAt

      // Manually set a new end date for testing update, as entity method `cancel` changes status too
      const newEndDate = new Date(sub.startDate.getFullYear(), sub.startDate.getMonth() + 6, 1);
      (sub as any)._endDate = newEndDate; // Directly modify for test purposes if no dedicated setter

      await repository.update(sub); // Repository's update should use the new internal _updatedAt

      const updatedSub = await repository.findById(sub.id);
      expect(updatedSub).not.toBeNull();
      expect(updatedSub!.name).toBe('New Name');
      expect(updatedSub!.status).toBe(SubscriptionStatus.PAUSED);
      expect(updatedSub!.endDate?.toISOString()).toBe(newEndDate.toISOString());
      expect(updatedSub!.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete a subscription', async () => {
      const sub = createTestSubscription();
      await repository.save(sub);
      await repository.delete(sub.id);
      const found = await repository.findById(sub.id);
      expect(found).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should return subscriptions of a specific status', async () => {
      const activeSub = createTestSubscription({ name: 'Active Sub', status: SubscriptionStatus.ACTIVE });
      const pausedSub = createTestSubscription({ name: 'Paused Sub', status: SubscriptionStatus.PAUSED });
      await repository.save(activeSub);
      await repository.save(pausedSub);

      const active = await repository.findByStatus(SubscriptionStatus.ACTIVE);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(activeSub.id);

      const paused = await repository.findByStatus(SubscriptionStatus.PAUSED);
      expect(paused).toHaveLength(1);
      expect(paused[0].id).toBe(pausedSub.id);
    });
  });

  describe('findActiveSubscriptions', () => {
    it('should return only active subscriptions', async () => {
      const activeSub = createTestSubscription({ status: SubscriptionStatus.ACTIVE });
      const pausedSub = createTestSubscription({ status: SubscriptionStatus.PAUSED });
      await repository.save(activeSub);
      await repository.save(pausedSub);

      const result = await repository.findActiveSubscriptions();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(activeSub.id);
    });
  });

  describe('findByCategory', () => {
    it('should return subscriptions for a specific categoryId', async () => {
      const cat1 = testCategory; // Used in createTestSubscription default
      const cat2 = createTestCategory({id: randomUUID(), name: "Category 2", type: TransactionType.EXPENSE}); // Ensure type is valid for subs
      await testSql`INSERT INTO categories (id, name, type, color, is_active, created_at, updated_at) VALUES (${cat2.id}, ${cat2.name}, ${cat2.type.toString()}, ${cat2.color}, ${cat2.isActive}, ${cat2.createdAt.toISOString()}, ${cat2.updatedAt.toISOString()})`;


      const sub1 = createTestSubscription({ categoryId: cat1.id });
      const sub2 = createTestSubscription({ categoryId: cat2.id });
      await repository.save(sub1);
      await repository.save(sub2);

      const results = await repository.findByCategory(cat1.id);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(sub1.id);
    });
  });

  describe('findByPaymentMethod', () => {
    it('should return subscriptions for a specific paymentMethodId', async () => {
      const pm1 = testPaymentMethod; // Used in createTestSubscription default
      const pm2 = createTestPaymentMethod({id: randomUUID(), name: "PM 2", type: PaymentMethodType.CREDIT_CARD}); // Ensure type is valid for subs
      await testSql`INSERT INTO payment_methods (id, name, type, is_active, created_at, updated_at) VALUES (${pm2.id}, ${pm2.name}, ${pm2.type.toString()}, ${pm2.isActive}, ${pm2.createdAt.toISOString()}, ${pm2.updatedAt.toISOString()})`;

      const sub1 = createTestSubscription({ paymentMethodId: pm1.id });
      const sub2 = createTestSubscription({ paymentMethodId: pm2.id });
      await repository.save(sub1);
      await repository.save(sub2);

      const results = await repository.findByPaymentMethod(pm1.id);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(sub1.id);
    });
  });

  describe('findByName', () => {
    it('should find an active subscription by its name (case-insensitive)', async () => {
      const sub = createTestSubscription({ name: 'My Unique Subscription' });
      await repository.save(sub);

      const found = await repository.findByName('my unique subscription');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(sub.id);
    });

    it('should return null if no active subscription matches the name', async () => {
      const sub = createTestSubscription({ name: 'Inactive Sub', status: SubscriptionStatus.CANCELLED });
      await repository.save(sub);

      const found = await repository.findByName('Inactive Sub');
      expect(found).toBeNull();
    });
  });

  // Test for findActiveForMonth might be more complex due to date mocking or specific date setups.
  // Skipping for this initial setup but important for full coverage.
});
