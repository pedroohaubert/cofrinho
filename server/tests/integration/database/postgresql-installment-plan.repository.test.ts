import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSQLInstallmentPlanRepository } from '@/infrastructure/database/repositories/postgresql-installment-plan.repository';
import { InstallmentPlan, InstallmentPlanStatus } from '@/domain/entities/installment-plan';
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

describe('PostgreSQLInstallmentPlanRepository Integration Tests', () => {
  let repository: PostgreSQLInstallmentPlanRepository;
  let testCategory: Category;
  let testPaymentMethod: PaymentMethod;

  beforeAll(async () => {
    repository = new PostgreSQLInstallmentPlanRepository(testSql);
    console.log("Opened test database connection for InstallmentPlanRepository.");
  });

  afterAll(async () => {
    await testSql.end();
    console.log("Closed test database connection for InstallmentPlanRepository.");
  });

  beforeEach(async () => {
    await testSql`TRUNCATE TABLE installment_plans, categories, payment_methods RESTART IDENTITY CASCADE;`;

    testCategory = new Category(
      randomUUID(),
      'Test Category For Installments',
      TransactionType.EXPENSE,
      '#00FF00'
    );
    await testSql`
      INSERT INTO categories (id, name, type, color, is_active, created_at, updated_at)
      VALUES (${testCategory.id}, ${testCategory.name}, ${testCategory.type}, ${testCategory.color}, ${testCategory.isActive}, ${testCategory.createdAt.toISOString()}, ${testCategory.updatedAt.toISOString()})
    `;

    testPaymentMethod = new PaymentMethod(
      randomUUID(),
      'Test PM For Installments',
      PaymentMethodType.CREDIT_CARD // Installments typically use credit cards
    );
    await testSql`
      INSERT INTO payment_methods (id, name, type, is_active, created_at, updated_at)
      VALUES (${testPaymentMethod.id}, ${testPaymentMethod.name}, ${testPaymentMethod.type}, ${testPaymentMethod.isActive}, ${testPaymentMethod.createdAt.toISOString()}, ${testPaymentMethod.updatedAt.toISOString()})
    `;
  });

  const createTestInstallmentPlan = (props: Partial<InstallmentPlan> & { id?: string } = {}): InstallmentPlan => {
    const id = props.id || randomUUID();
    const now = new Date();
    return new InstallmentPlan(
      id,
      props.totalAmount || new Money(1200, 'BRL'),
      props.purchaseDate || new Date(now.getFullYear(), now.getMonth(), 15),
      props.installmentCount || 12,
      props.description || `Test Plan ${id.substring(0, 8)}`,
      props.paymentMethodId || testPaymentMethod.id,
      props.categoryId || testCategory.id,
      props.status || InstallmentPlanStatus.ACTIVE,
      props.createdAt || new Date(),
      props.updatedAt || new Date()
    );
  };

  describe('save and findById', () => {
    it('should save a new installment plan and retrieve it by ID', async () => {
      const plan = createTestInstallmentPlan({ description: 'Laptop Purchase' });
      await repository.save(plan);

      const found = await repository.findById(plan.id);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(InstallmentPlan);
      expect(found!.id).toBe(plan.id);
      expect(found!.description).toBe(plan.description);
      expect(found!.totalAmount.equals(plan.totalAmount)).toBe(true);
      expect(found!.monthlyAmount.amount).toBeCloseTo(plan.totalAmount.amount / plan.installmentCount);
      expect(found!.purchaseDate.toISOString()).toBe(plan.purchaseDate.toISOString());
      expect(found!.installmentCount).toBe(plan.installmentCount);
      expect(found!.status).toBe(plan.status);
    });

    it('should return null if installment plan with given ID does not exist', async () => {
      const found = await repository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all installment plans ordered by purchase_date DESC, created_at DESC', async () => {
      const plan1Date = new Date(2024, 0, 15); // Jan 15
      const plan2Date = new Date(2024, 1, 15); // Feb 15
      const plan3Date = new Date(2024, 0, 15); // Jan 15 again, different createdAt

      const plan1 = createTestInstallmentPlan({ description: 'Plan A', purchaseDate: plan1Date, createdAt: new Date(plan1Date.getTime() + 1000) });
      const plan2 = createTestInstallmentPlan({ description: 'Plan B', purchaseDate: plan2Date });
      const plan3 = createTestInstallmentPlan({ description: 'Plan C', purchaseDate: plan3Date, createdAt: new Date(plan1Date.getTime() + 2000) }); // Created later

      await repository.save(plan1);
      await repository.save(plan2);
      await repository.save(plan3);

      const plans = await repository.findAll();
      expect(plans).toHaveLength(3);
      expect(plans[0].description).toBe('Plan B'); // Feb 15
      expect(plans[1].description).toBe('Plan C'); // Jan 15, later createdAt
      expect(plans[2].description).toBe('Plan A'); // Jan 15, earlier createdAt
    });
  });

  describe('update', () => {
    it('should update description, status, and updated_at of an existing plan', async () => {
      const plan = createTestInstallmentPlan({ description: 'Initial Desc', status: InstallmentPlanStatus.ACTIVE });
      await repository.save(plan);
      const initialPlan = (await repository.findById(plan.id))!; // Get DB version with correct initial updated_at

      await new Promise(resolve => setTimeout(resolve, 10));

      plan.updateDescription('Updated Desc');
      plan.complete(); // Sets status to COMPLETED and updates internal _updatedAt

      await repository.update(plan);

      const updatedPlan = await repository.findById(plan.id);
      expect(updatedPlan).not.toBeNull();
      expect(updatedPlan!.description).toBe('Updated Desc');
      expect(updatedPlan!.status).toBe(InstallmentPlanStatus.COMPLETED);
      expect(updatedPlan!.totalAmount.equals(initialPlan.totalAmount)).toBe(true); // Should not change
      expect(updatedPlan!.updatedAt.getTime()).toBeGreaterThan(initialPlan.updatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete an installment plan', async () => {
      const plan = createTestInstallmentPlan();
      await repository.save(plan);
      await repository.delete(plan.id);
      const found = await repository.findById(plan.id);
      expect(found).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should return plans of a specific status', async () => {
      const activePlan = createTestInstallmentPlan({ status: InstallmentPlanStatus.ACTIVE });
      const completedPlan = createTestInstallmentPlan({ status: InstallmentPlanStatus.COMPLETED });
      await repository.save(activePlan);
      await repository.save(completedPlan);

      const active = await repository.findByStatus(InstallmentPlanStatus.ACTIVE);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(activePlan.id);
    });
  });

  describe('findActiveInstallmentPlans', () => {
    it('should return only active plans', async () => {
      const activePlan = createTestInstallmentPlan({ status: InstallmentPlanStatus.ACTIVE });
      const completedPlan = createTestInstallmentPlan({ status: InstallmentPlanStatus.COMPLETED });
      await repository.save(activePlan);
      await repository.save(completedPlan);

      const result = await repository.findActiveInstallmentPlans();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(activePlan.id);
    });
  });

  describe('findByCategory', () => {
    it('should return plans for a specific categoryId', async () => {
      const cat2 = new Category(randomUUID(), 'Category B', TransactionType.EXPENSE);
      await testSql`INSERT INTO categories (id, name, type, color, is_active, created_at, updated_at) VALUES (${cat2.id}, ${cat2.name}, ${cat2.type}, ${cat2.color}, ${cat2.isActive}, ${cat2.createdAt.toISOString()}, ${cat2.updatedAt.toISOString()})`;

      const plan1 = createTestInstallmentPlan({ categoryId: testCategory.id });
      const plan2 = createTestInstallmentPlan({ categoryId: cat2.id });
      await repository.save(plan1);
      await repository.save(plan2);

      const results = await repository.findByCategory(testCategory.id);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(plan1.id);
    });
  });

  describe('findByPaymentMethod', () => {
    it('should return plans for a specific paymentMethodId', async () => {
      const pm2 = new PaymentMethod(randomUUID(), 'PM B', PaymentMethodType.CREDIT_CARD);
      await testSql`INSERT INTO payment_methods (id, name, type, is_active, created_at, updated_at) VALUES (${pm2.id}, ${pm2.name}, ${pm2.type}, ${pm2.isActive}, ${pm2.createdAt.toISOString()}, ${pm2.updatedAt.toISOString()})`;

      const plan1 = createTestInstallmentPlan({ paymentMethodId: testPaymentMethod.id });
      const plan2 = createTestInstallmentPlan({ paymentMethodId: pm2.id });
      await repository.save(plan1);
      await repository.save(plan2);

      const results = await repository.findByPaymentMethod(testPaymentMethod.id);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(plan1.id);
    });
  });

  describe('findByDateRange', () => {
    it('should return plans within the purchase date range', async () => {
      const date1 = new Date(2024, 0, 10); // Jan 10
      const date2 = new Date(2024, 0, 20); // Jan 20
      const date3 = new Date(2024, 1, 10); // Feb 10

      const plan1 = createTestInstallmentPlan({ purchaseDate: date1 });
      const plan2 = createTestInstallmentPlan({ purchaseDate: date2 });
      const plan3 = createTestInstallmentPlan({ purchaseDate: date3 });

      await repository.save(plan1);
      await repository.save(plan2);
      await repository.save(plan3);

      const results = await repository.findByDateRange(
        new Date(2024, 0, 1), // Jan 1
        new Date(2024, 0, 31)  // Jan 31
      );
      expect(results).toHaveLength(2);
      expect(results.some(p => p.id === plan1.id)).toBe(true);
      expect(results.some(p => p.id === plan2.id)).toBe(true);
    });
  });

  // Note: findPendingInstallmentsForMonth logic is more complex as it depends on current date
  // and how installments are generated/tracked, which is beyond repository scope.
  // A simple test can check if it returns active plans within a certain purchase window.
  describe('findPendingInstallmentsForMonth (basic check)', () => {
    it('should return active plans with purchase_date on or before the end of the query month', async () => {
      const plan1 = createTestInstallmentPlan({ // Purchased in Jan, active
        purchaseDate: new Date(2024, 0, 15), status: InstallmentPlanStatus.ACTIVE
      });
      const plan2 = createTestInstallmentPlan({ // Purchased in Feb, active
        purchaseDate: new Date(2024, 1, 15), status: InstallmentPlanStatus.ACTIVE
      });
      const plan3 = createTestInstallmentPlan({ // Purchased in Jan, completed
        purchaseDate: new Date(2024, 0, 10), status: InstallmentPlanStatus.COMPLETED
      });

      await repository.save(plan1);
      await repository.save(plan2);
      await repository.save(plan3);

      // Query for Jan 2024
      const results = await repository.findPendingInstallmentsForMonth(2024, 1);
      expect(results).toHaveLength(1); // Only plan1
      expect(results[0].id).toBe(plan1.id);
    });
  });
});
