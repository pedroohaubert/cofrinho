import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method.js';

describe('PaymentMethod Entity', () => {
  let paymentMethodData: {
    id: string;
    name: string;
    type: PaymentMethodType;
  };

  beforeEach(() => {
    paymentMethodData = {
      id: 'pm-123',
      name: 'My Credit Card',
      type: PaymentMethodType.CREDIT_CARD
    };
  });

  describe('constructor', () => {
    it('should create a payment method with all required fields', () => {
      const paymentMethod = new PaymentMethod(
        paymentMethodData.id,
        paymentMethodData.name,
        paymentMethodData.type
      );

      expect(paymentMethod.id).toBe(paymentMethodData.id);
      expect(paymentMethod.name).toBe(paymentMethodData.name);
      expect(paymentMethod.type).toBe(paymentMethodData.type);
      expect(paymentMethod.isActive).toBe(true);
      expect(paymentMethod.createdAt).toBeInstanceOf(Date);
      expect(paymentMethod.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow setting isActive to false', () => {
      const paymentMethod = new PaymentMethod(
        paymentMethodData.id,
        paymentMethodData.name,
        paymentMethodData.type,
        false
      );

      expect(paymentMethod.isActive).toBe(false);
    });

    it('should accept custom created and updated dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      
      const paymentMethod = new PaymentMethod(
        paymentMethodData.id,
        paymentMethodData.name,
        paymentMethodData.type,
        true,
        createdAt,
        updatedAt
      );

      expect(paymentMethod.createdAt).toEqual(createdAt);
      expect(paymentMethod.updatedAt).toEqual(updatedAt);
    });

    it('should throw error for empty id', () => {
      expect(() => new PaymentMethod(
        '',
        paymentMethodData.name,
        paymentMethodData.type
      )).toThrow('Payment method ID cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(() => new PaymentMethod(
        '   ',
        paymentMethodData.name,
        paymentMethodData.type
      )).toThrow('Payment method ID cannot be empty');
    });

    it('should throw error for empty name', () => {
      expect(() => new PaymentMethod(
        paymentMethodData.id,
        '',
        paymentMethodData.type
      )).toThrow('Payment method name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => new PaymentMethod(
        paymentMethodData.id,
        '   ',
        paymentMethodData.type
      )).toThrow('Payment method name cannot be empty');
    });

    it('should throw error for name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => new PaymentMethod(
        paymentMethodData.id,
        longName,
        paymentMethodData.type
      )).toThrow('Payment method name cannot exceed 100 characters');
    });

    it('should throw error for invalid payment method type', () => {
      expect(() => new PaymentMethod(
        paymentMethodData.id,
        paymentMethodData.name,
        'invalid' as PaymentMethodType
      )).toThrow('Invalid payment method type');
    });
  });

  describe('updateName', () => {
    let paymentMethod: PaymentMethod;

    beforeEach(() => {
      paymentMethod = new PaymentMethod(
        paymentMethodData.id,
        paymentMethodData.name,
        paymentMethodData.type
      );
    });

    it('should update payment method name successfully', () => {
      const newName = 'Updated Payment Method';
      const oldUpdatedAt = paymentMethod.updatedAt;

      paymentMethod.updateName(newName);

      expect(paymentMethod.name).toBe(newName);
      expect(paymentMethod.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('should trim whitespace when updating name', () => {
      const newName = '  Updated Payment Method  ';
      paymentMethod.updateName(newName);

      expect(paymentMethod.name).toBe('Updated Payment Method');
    });

    it('should throw error for empty name', () => {
      expect(() => paymentMethod.updateName('')).toThrow('Payment method name cannot be empty');
    });

    it('should throw error for whitespace-only name', () => {
      expect(() => paymentMethod.updateName('   ')).toThrow('Payment method name cannot be empty');
    });

    it('should throw error for name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => paymentMethod.updateName(longName)).toThrow('Payment method name cannot exceed 100 characters');
    });
  });

  describe('activate and deactivate', () => {
    let paymentMethod: PaymentMethod;

    beforeEach(() => {
      paymentMethod = new PaymentMethod(
        paymentMethodData.id,
        paymentMethodData.name,
        paymentMethodData.type,
        false // Start as inactive
      );
    });

    it('should activate payment method', () => {
      paymentMethod.activate();

      expect(paymentMethod.isActive).toBe(true);
    });

    it('should deactivate payment method', () => {
      paymentMethod.activate(); // First activate
      paymentMethod.deactivate();

      expect(paymentMethod.isActive).toBe(false);
    });
  });

  describe('type checking methods', () => {
    it('should identify cash payment method correctly', () => {
      const cashMethod = new PaymentMethod(
        'pm-cash',
        'Cash',
        PaymentMethodType.CASH
      );

      expect(cashMethod.isCash()).toBe(true);
      expect(cashMethod.isBank()).toBe(false);
      expect(cashMethod.isCreditCard()).toBe(false);
    });

    it('should identify bank payment method correctly', () => {
      const bankMethod = new PaymentMethod(
        'pm-bank',
        'Bank Account',
        PaymentMethodType.BANK
      );

      expect(bankMethod.isCash()).toBe(false);
      expect(bankMethod.isBank()).toBe(true);
      expect(bankMethod.isCreditCard()).toBe(false);
    });

    it('should identify credit card payment method correctly', () => {
      const creditCardMethod = new PaymentMethod(
        'pm-credit',
        'Credit Card',
        PaymentMethodType.CREDIT_CARD
      );

      expect(creditCardMethod.isCash()).toBe(false);
      expect(creditCardMethod.isBank()).toBe(false);
      expect(creditCardMethod.isCreditCard()).toBe(true);
    });
  });

  describe('supportsInstallments', () => {
    it('should return true for credit card', () => {
      const creditCardMethod = new PaymentMethod(
        'pm-credit',
        'Credit Card',
        PaymentMethodType.CREDIT_CARD
      );

      expect(creditCardMethod.supportsInstallments()).toBe(true);
    });

    it('should return false for cash', () => {
      const cashMethod = new PaymentMethod(
        'pm-cash',
        'Cash',
        PaymentMethodType.CASH
      );

      expect(creditCardMethod.supportsInstallments()).toBe(false);
    });

    it('should return false for bank', () => {
      const bankMethod = new PaymentMethod(
        'pm-bank',
        'Bank Account',
        PaymentMethodType.BANK
      );

      expect(bankMethod.supportsInstallments()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for payment methods with same id', () => {
      const method1 = new PaymentMethod(
        paymentMethodData.id,
        paymentMethodData.name,
        paymentMethodData.type
      );
      const method2 = new PaymentMethod(
        paymentMethodData.id,
        'Different Name',
        PaymentMethodType.CASH
      );

      expect(method1.equals(method2)).toBe(true);
    });

    it('should return false for payment methods with different ids', () => {
      const method1 = new PaymentMethod(
        'pm-1',
        paymentMethodData.name,
        paymentMethodData.type
      );
      const method2 = new PaymentMethod(
        'pm-2',
        paymentMethodData.name,
        paymentMethodData.type
      );

      expect(method1.equals(method2)).toBe(false);
    });
  });

  describe('static factory methods', () => {
    describe('create', () => {
      it('should create a new payment method with all properties', () => {
        const paymentMethod = PaymentMethod.create(
          paymentMethodData.id,
          paymentMethodData.name,
          paymentMethodData.type
        );

        expect(paymentMethod.id).toBe(paymentMethodData.id);
        expect(paymentMethod.name).toBe(paymentMethodData.name);
        expect(paymentMethod.type).toBe(paymentMethodData.type);
        expect(paymentMethod.isActive).toBe(true);
        expect(paymentMethod.createdAt).toBeInstanceOf(Date);
        expect(paymentMethod.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('createCash', () => {
      it('should create a cash payment method with default name', () => {
        const paymentMethod = PaymentMethod.createCash('pm-cash');

        expect(paymentMethod.id).toBe('pm-cash');
        expect(paymentMethod.name).toBe('Cash');
        expect(paymentMethod.type).toBe(PaymentMethodType.CASH);
        expect(paymentMethod.isCash()).toBe(true);
      });

      it('should create a cash payment method with custom name', () => {
        const customName = 'Petty Cash';
        const paymentMethod = PaymentMethod.createCash('pm-cash', customName);

        expect(paymentMethod.name).toBe(customName);
        expect(paymentMethod.type).toBe(PaymentMethodType.CASH);
      });
    });

    describe('createBank', () => {
      it('should create a bank payment method', () => {
        const bankName = 'Chase Checking';
        const paymentMethod = PaymentMethod.createBank('pm-bank', bankName);

        expect(paymentMethod.id).toBe('pm-bank');
        expect(paymentMethod.name).toBe(bankName);
        expect(paymentMethod.type).toBe(PaymentMethodType.BANK);
        expect(paymentMethod.isBank()).toBe(true);
      });
    });

    describe('createCreditCard', () => {
      it('should create a credit card payment method', () => {
        const cardName = 'Visa Rewards';
        const paymentMethod = PaymentMethod.createCreditCard('pm-credit', cardName);

        expect(paymentMethod.id).toBe('pm-credit');
        expect(paymentMethod.name).toBe(cardName);
        expect(paymentMethod.type).toBe(PaymentMethodType.CREDIT_CARD);
        expect(paymentMethod.isCreditCard()).toBe(true);
        expect(paymentMethod.supportsInstallments()).toBe(true);
      });
    });
  });

  describe('PaymentMethodType enum', () => {
    it('should have correct enum values', () => {
      expect(PaymentMethodType.CASH).toBe('cash');
      expect(PaymentMethodType.BANK).toBe('bank');
      expect(PaymentMethodType.CREDIT_CARD).toBe('credit_card');
    });

    it('should only have three values', () => {
      const values = Object.values(PaymentMethodType);
      expect(values).toHaveLength(3);
      expect(values).toContain('cash');
      expect(values).toContain('bank');
      expect(values).toContain('credit_card');
    });
  });

  describe('edge cases and validation', () => {
    it('should handle special characters in name', () => {
      const specialName = 'Credit Card (5% Cashback)';
      const paymentMethod = new PaymentMethod(
        paymentMethodData.id,
        specialName,
        paymentMethodData.type
      );

      expect(paymentMethod.name).toBe(specialName);
    });

    it('should handle unicode characters in name', () => {
      const unicodeName = '💳 Credit Card';
      const paymentMethod = new PaymentMethod(
        paymentMethodData.id,
        unicodeName,
        paymentMethodData.type
      );

      expect(paymentMethod.name).toBe(unicodeName);
    });

    it('should handle name at maximum length', () => {
      const maxLengthName = 'a'.repeat(100);
      const paymentMethod = new PaymentMethod(
        paymentMethodData.id,
        maxLengthName,
        paymentMethodData.type
      );

      expect(paymentMethod.name).toBe(maxLengthName);
      expect(paymentMethod.name.length).toBe(100);
    });
  });
}); 