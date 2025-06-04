import postgres from 'postgres';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSQLPaymentMethodRepository } from '@/infrastructure/database/repositories/postgresql-payment-method.repository';
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

describe.skipIf(!runTests)('PostgreSQLPaymentMethodRepository Integration Tests', () => {
  let testSql: postgres.Sql;
  let repository: PostgreSQLPaymentMethodRepository;

  beforeAll(async () => {
    if (!runTests) return;
    
    testSql = postgres(TEST_DATABASE_URL!);
    repository = new PostgreSQLPaymentMethodRepository(testSql);
    console.log("Opened test database connection.");
  });

  afterAll(async () => {
    if (!runTests || !testSql) return;
    
    await testSql.end();
    console.log("Closed test database connection.");
  });

  beforeEach(async () => {
    if (!runTests) return;
    
    // Clean payment_methods table before each test
    await testSql`TRUNCATE TABLE payment_methods RESTART IDENTITY CASCADE;`;
  });

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

  describe('save and findById', () => {
    it('should save a new payment method and retrieve it by ID', async () => {
      const pm = createTestPaymentMethod({ name: 'My Visa', type: PaymentMethodType.CREDIT_CARD });
      await repository.save(pm);

      const found = await repository.findById(pm.id);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(PaymentMethod);
      expect(found!.id).toBe(pm.id);
      expect(found!.name).toBe(pm.name);
      expect(found!.type).toBe(pm.type);
      expect(found!.isActive).toBe(pm.isActive);
      expect(found!.createdAt.toISOString()).toBe(pm.createdAt.toISOString());
      expect(found!.updatedAt.toISOString()).toBe(pm.updatedAt.toISOString());
    });

    it('should return null if payment method with given ID does not exist', async () => {
      const found = await repository.findById(randomUUID());
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all payment methods ordered by name', async () => {
      const pm1 = createTestPaymentMethod({ name: 'Visa' });
      const pm2 = createTestPaymentMethod({ name: 'Amex' });
      const pm3 = createTestPaymentMethod({ name: 'Cash Wallet' });
      await repository.save(pm1);
      await repository.save(pm2);
      await repository.save(pm3);

      const paymentMethods = await repository.findAll();
      expect(paymentMethods).toHaveLength(3);
      expect(paymentMethods[0].name).toBe('Amex'); // Ordered by name
      expect(paymentMethods[1].name).toBe('Cash Wallet');
      expect(paymentMethods[2].name).toBe('Visa');
    });
  });

  describe('update', () => {
    it('should update an existing payment method properties', async () => {
      const pm = createTestPaymentMethod({ name: 'Old Name', type: PaymentMethodType.CASH });
      await repository.save(pm);

      const initialUpdatedAt = pm.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10));

      // Note: The repository update method only updates name, isActive, and updatedAt. Type is not updatable.
      pm.updateName('New Name');
      pm.deactivate();

      await repository.update(pm);

      const updatedPm = await repository.findById(pm.id);
      expect(updatedPm).not.toBeNull();
      expect(updatedPm!.name).toBe('New Name');
      expect(updatedPm!.isActive).toBe(false);
      expect(updatedPm!.type).toBe(PaymentMethodType.CASH); // Type should remain unchanged
      expect(updatedPm!.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });
  });

  describe('delete', () => {
    it('should delete a payment method', async () => {
      const pm = createTestPaymentMethod();
      await repository.save(pm);
      await repository.delete(pm.id);
      const found = await repository.findById(pm.id);
      expect(found).toBeNull();
    });
  });

  describe('findActivePaymentMethods', () => {
    it('should return only active payment methods', async () => {
      const activePm = createTestPaymentMethod({ name: 'Active PM', isActive: true });
      const inactivePm = createTestPaymentMethod({ name: 'Inactive PM', isActive: false });
      await repository.save(activePm);
      await repository.save(inactivePm);

      const activeMethods = await repository.findActivePaymentMethods();
      expect(activeMethods).toHaveLength(1);
      expect(activeMethods[0].id).toBe(activePm.id);
    });
  });

  describe('findInactivePaymentMethods', () => {
    it('should return only inactive payment methods', async () => {
      const activePm = createTestPaymentMethod({ name: 'Active PM', isActive: true });
      const inactivePm = createTestPaymentMethod({ name: 'Inactive PM', isActive: false });
      await repository.save(activePm);
      await repository.save(inactivePm);

      const inactiveMethods = await repository.findInactivePaymentMethods();
      expect(inactiveMethods).toHaveLength(1);
      expect(inactiveMethods[0].id).toBe(inactivePm.id);
    });
  });

  describe('findByName', () => {
    it('should find an active payment method by name (case-insensitive)', async () => {
      const pm = createTestPaymentMethod({ name: 'My Checking Account' });
      await repository.save(pm);

      const found = await repository.findByName('my checking account');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(pm.id);
    });

    it('should return null if no active payment method matches the name', async () => {
      const pm = createTestPaymentMethod({ name: 'My Savings Account', isActive: false });
      await repository.save(pm); // Save it as inactive

      const found = await repository.findByName('My Savings Account');
      expect(found).toBeNull();
    });
  });

  describe('findByType', () => {
    it('should return active payment methods of a specific type', async () => {
      const cashPm = createTestPaymentMethod({ name: 'Cash', type: PaymentMethodType.CASH });
      const creditPm = createTestPaymentMethod({ name: 'Visa', type: PaymentMethodType.CREDIT_CARD });
      const inactiveCashPm = createTestPaymentMethod({ name: 'Old Cash', type: PaymentMethodType.CASH, isActive: false });

      await repository.save(cashPm);
      await repository.save(creditPm);
      await repository.save(inactiveCashPm);

      const cashMethods = await repository.findByType(PaymentMethodType.CASH);
      expect(cashMethods).toHaveLength(1);
      expect(cashMethods[0].id).toBe(cashPm.id);

      const creditMethods = await repository.findByType(PaymentMethodType.CREDIT_CARD);
      expect(creditMethods).toHaveLength(1);
      expect(creditMethods[0].id).toBe(creditPm.id);
    });
  });

  describe('findSupportingInstallments', () => {
    it('should return active credit card and bank payment methods', async () => {
      const cashPm = createTestPaymentMethod({ name: 'Cash', type: PaymentMethodType.CASH });
      const creditPm = createTestPaymentMethod({ name: 'Visa', type: PaymentMethodType.CREDIT_CARD });
      const bankPm = createTestPaymentMethod({ name: 'Bank', type: PaymentMethodType.BANK });
      const inactiveCreditPm = createTestPaymentMethod({ name: 'Old Visa', type: PaymentMethodType.CREDIT_CARD, isActive: false });

      await repository.save(cashPm);
      await repository.save(creditPm);
      await repository.save(bankPm);
      await repository.save(inactiveCreditPm);

      const installmentMethods = await repository.findSupportingInstallments();
      expect(installmentMethods).toHaveLength(2); // Bank and Visa
      expect(installmentMethods.some(pm => pm.id === creditPm.id)).toBe(true);
      expect(installmentMethods.some(pm => pm.id === bankPm.id)).toBe(true);
    });
  });
});
