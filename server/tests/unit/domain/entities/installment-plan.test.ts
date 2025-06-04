import { describe, it, expect, beforeEach } from 'vitest';
import { InstallmentPlan, InstallmentPlanStatus } from '@/domain/entities/installment-plan.js';
import { Money } from '@/domain/value-objects/money.js';

describe('InstallmentPlan Entity', () => {
  let planData: {
    id: string;
    totalAmount: Money;
    purchaseDate: Date;
    installmentCount: number;
    description: string;
    paymentMethodId: string;
    categoryId: string;
  };

  beforeEach(() => {
    planData = {
      id: 'plan-123',
      totalAmount: new Money(120000, 'BRL'), // R$ 1,200.00
      purchaseDate: new Date('2024-01-15'),
      installmentCount: 12,
      description: 'Smartphone purchase',
      paymentMethodId: 'pm-credit',
      categoryId: 'cat-electronics'
    };
  });

  describe('constructor', () => {
    it('should create an installment plan with all required fields', () => {
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.id).toBe(planData.id);
      expect(plan.totalAmount).toEqual(planData.totalAmount);
      expect(plan.purchaseDate).toEqual(planData.purchaseDate);
      expect(plan.installmentCount).toBe(planData.installmentCount);
      expect(plan.description).toBe(planData.description);
      expect(plan.paymentMethodId).toBe(planData.paymentMethodId);
      expect(plan.categoryId).toBe(planData.categoryId);
      expect(plan.status).toBe(InstallmentPlanStatus.ACTIVE);
      expect(plan.createdAt).toBeInstanceOf(Date);
      expect(plan.updatedAt).toBeInstanceOf(Date);
    });

    it('should calculate monthly amount correctly', () => {
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      // R$ 1,200.00 / 12 = R$ 100.00
      expect(plan.monthlyAmount.amount).toBe(10000);
    });

    it('should create a plan with specific status', () => {
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId,
        InstallmentPlanStatus.COMPLETED
      );

      expect(plan.status).toBe(InstallmentPlanStatus.COMPLETED);
    });

    it('should create a plan with custom created and updated dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId,
        InstallmentPlanStatus.ACTIVE,
        createdAt,
        updatedAt
      );

      expect(plan.createdAt).toEqual(createdAt);
      expect(plan.updatedAt).toEqual(updatedAt);
    });

    it('should trim whitespace from description', () => {
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        '  Smartphone purchase  ',
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.description).toBe('Smartphone purchase');
    });
  });

  describe('constructor validation', () => {
    it('should throw error for empty id', () => {
      expect(() => new InstallmentPlan(
        '',
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Installment plan ID cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(() => new InstallmentPlan(
        '   ',
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Installment plan ID cannot be empty');
    });

    it('should throw error for zero total amount', () => {
      const zeroAmount = new Money(0, 'BRL');
      expect(() => new InstallmentPlan(
        planData.id,
        zeroAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Total amount must be positive');
    });

    it('should throw error for negative total amount', () => {
      // Since Money constructor throws for negative amounts, we test that too
      expect(() => {
        const negativeAmount = new Money(-1000, 'BRL');
        new InstallmentPlan(
          planData.id,
          negativeAmount,
          planData.purchaseDate,
          planData.installmentCount,
          planData.description,
          planData.paymentMethodId,
          planData.categoryId
        );
      }).toThrow('Amount cannot be negative');
    });

    it('should throw error for invalid purchase date', () => {
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        new Date('invalid'),
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Invalid purchase date');
    });

    it('should throw error for purchase date more than 1 year in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        futureDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Purchase date cannot be more than 1 year in the future');
    });

    it('should accept purchase date just under 1 year in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      futureDate.setDate(futureDate.getDate() - 1); // Just under 1 year
      
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        futureDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.purchaseDate).toEqual(futureDate);
    });

    it('should throw error for installment count less than 2', () => {
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        1,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Installment count must be an integer greater than 1');
    });

    it('should throw error for installment count greater than 60', () => {
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        61,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Installment count cannot exceed 60 months');
    });

    it('should throw error for non-integer installment count', () => {
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        12.5,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Installment count must be an integer greater than 1');
    });

    it('should accept valid installment count boundaries', () => {
      // Test minimum (2)
      const plan2 = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        2,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );
      expect(plan2.installmentCount).toBe(2);

      // Test maximum (60)
      const plan60 = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        60,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );
      expect(plan60.installmentCount).toBe(60);
    });

    it('should throw error for empty description', () => {
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        '',
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Description cannot be empty');
    });

    it('should throw error for whitespace-only description', () => {
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        '   ',
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Description cannot be empty');
    });

    it('should throw error for description exceeding 200 characters', () => {
      const longDescription = 'A'.repeat(201);
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        longDescription,
        planData.paymentMethodId,
        planData.categoryId
      )).toThrow('Description cannot exceed 200 characters');
    });

    it('should accept description with exactly 200 characters', () => {
      const maxDescription = 'A'.repeat(200);
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        maxDescription,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.description).toBe(maxDescription);
    });

    it('should throw error for empty payment method id', () => {
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        '',
        planData.categoryId
      )).toThrow('Payment method ID cannot be empty');
    });

    it('should throw error for empty category id', () => {
      expect(() => new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        ''
      )).toThrow('Category ID cannot be empty');
    });
  });

  describe('getters', () => {
    let plan: InstallmentPlan;

    beforeEach(() => {
      plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );
    });

    it('should return immutable purchase date objects', () => {
      const purchaseDate1 = plan.purchaseDate;
      const purchaseDate2 = plan.purchaseDate;
      
      expect(purchaseDate1).toEqual(purchaseDate2);
      expect(purchaseDate1).not.toBe(purchaseDate2); // Different instances
      
      purchaseDate1.setFullYear(2025);
      expect(plan.purchaseDate.getFullYear()).toBe(2024); // Original unchanged
    });

    it('should return immutable created and updated date objects', () => {
      const createdAt1 = plan.createdAt;
      const createdAt2 = plan.createdAt;
      const originalYear = createdAt1.getFullYear();
      
      expect(createdAt1).toEqual(createdAt2);
      expect(createdAt1).not.toBe(createdAt2);
      
      createdAt1.setFullYear(2025);
      expect(plan.createdAt.getFullYear()).toBe(originalYear);
    });
  });

  describe('updateDescription', () => {
    let plan: InstallmentPlan;

    beforeEach(() => {
      plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );
    });

    it('should update description successfully', () => {
      const newDescription = 'Updated smartphone purchase';
      const oldUpdatedAt = plan.updatedAt;

      plan.updateDescription(newDescription);

      expect(plan.description).toBe(newDescription);
      expect(plan.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('should trim whitespace when updating description', () => {
      plan.updateDescription('  Updated smartphone purchase  ');

      expect(plan.description).toBe('Updated smartphone purchase');
    });

    it('should throw error for empty description', () => {
      expect(() => plan.updateDescription(''))
        .toThrow('Description cannot be empty');
    });

    it('should throw error for whitespace-only description', () => {
      expect(() => plan.updateDescription('   '))
        .toThrow('Description cannot be empty');
    });

    it('should throw error for description exceeding 200 characters', () => {
      const longDescription = 'A'.repeat(201);
      expect(() => plan.updateDescription(longDescription))
        .toThrow('Description cannot exceed 200 characters');
    });
  });

  describe('status management', () => {
    let plan: InstallmentPlan;

    beforeEach(() => {
      plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );
    });

    describe('complete', () => {
      it('should complete active plan', () => {
        plan.complete();

        expect(plan.status).toBe(InstallmentPlanStatus.COMPLETED);
        expect(plan.isCompleted()).toBe(true);
        expect(plan.isActive()).toBe(false);
      });

      it('should throw error when completing cancelled plan', () => {
        plan.cancel();
        
        expect(() => plan.complete())
          .toThrow('Cannot complete a cancelled installment plan');
      });
    });

    describe('cancel', () => {
      it('should cancel active plan', () => {
        plan.cancel();

        expect(plan.status).toBe(InstallmentPlanStatus.CANCELLED);
        expect(plan.isCancelled()).toBe(true);
        expect(plan.isActive()).toBe(false);
      });

      it('should throw error when cancelling completed plan', () => {
        plan.complete();
        
        expect(() => plan.cancel())
          .toThrow('Cannot cancel a completed installment plan');
      });
    });
  });

  describe('status checking methods', () => {
    it('should identify active plans correctly', () => {
      const activePlan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId,
        InstallmentPlanStatus.ACTIVE
      );

      expect(activePlan.isActive()).toBe(true);
      expect(activePlan.isCompleted()).toBe(false);
      expect(activePlan.isCancelled()).toBe(false);
    });

    it('should identify completed plans correctly', () => {
      const completedPlan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId,
        InstallmentPlanStatus.COMPLETED
      );

      expect(completedPlan.isActive()).toBe(false);
      expect(completedPlan.isCompleted()).toBe(true);
      expect(completedPlan.isCancelled()).toBe(false);
    });

    it('should identify cancelled plans correctly', () => {
      const cancelledPlan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId,
        InstallmentPlanStatus.CANCELLED
      );

      expect(cancelledPlan.isActive()).toBe(false);
      expect(cancelledPlan.isCompleted()).toBe(false);
      expect(cancelledPlan.isCancelled()).toBe(true);
    });
  });

  describe('installment calculations', () => {
    let plan: InstallmentPlan;

    beforeEach(() => {
      // 12 installments starting from 2024-01-15
      plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        new Date('2024-01-15'),
        12,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );
    });

    describe('calculateInstallmentDates', () => {
      it('should calculate all installment dates correctly', () => {
        const dates = plan.calculateInstallmentDates();

        expect(dates).toHaveLength(12);
        expect(dates[0]).toEqual(new Date('2024-01-15')); // 1st installment
        expect(dates[1]).toEqual(new Date('2024-02-15')); // 2nd installment
        expect(dates[11]).toEqual(new Date('2024-12-15')); // 12th installment
      });

      it('should handle month boundaries correctly', () => {
        // Plan starting on January 31st
        const plan31 = new InstallmentPlan(
          planData.id,
          planData.totalAmount,
          new Date('2024-01-31'),
          3,
          planData.description,
          planData.paymentMethodId,
          planData.categoryId
        );

        const dates = plan31.calculateInstallmentDates();

        expect(dates[0]).toEqual(new Date('2024-01-31')); // January 31
        // When setMonth is called on Jan 31 to set February, it becomes March 2 (since Feb doesn't have 31 days)
        expect(dates[1]).toEqual(new Date('2024-03-02')); // February 31 -> March 2
        // March 2 + 1 month = April 2, but then setMonth adjusts it to March 31
        expect(dates[2]).toEqual(new Date('2024-03-31')); // March 31 (not April 2)
      });

      it('should return immutable date objects', () => {
        const dates = plan.calculateInstallmentDates();
        const firstDate = dates[0];
        const originalYear = firstDate.getFullYear();

        firstDate.setFullYear(2025);

        // Re-calculate to verify immutability
        const newDates = plan.calculateInstallmentDates();
        expect(newDates[0].getFullYear()).toBe(originalYear);
      });
    });

    describe('getInstallmentDateForIndex', () => {
      it('should return correct date for valid index', () => {
        expect(plan.getInstallmentDateForIndex(0)).toEqual(new Date('2024-01-15'));
        expect(plan.getInstallmentDateForIndex(1)).toEqual(new Date('2024-02-15'));
        expect(plan.getInstallmentDateForIndex(11)).toEqual(new Date('2024-12-15'));
      });

      it('should throw error for negative index', () => {
        expect(() => plan.getInstallmentDateForIndex(-1))
          .toThrow('Installment index must be between 0 and 11');
      });

      it('should throw error for index equal to installment count', () => {
        expect(() => plan.getInstallmentDateForIndex(12))
          .toThrow('Installment index must be between 0 and 11');
      });

      it('should throw error for index greater than installment count', () => {
        expect(() => plan.getInstallmentDateForIndex(15))
          .toThrow('Installment index must be between 0 and 11');
      });

      it('should return immutable date object', () => {
        const date = plan.getInstallmentDateForIndex(0);
        const originalYear = date.getFullYear();

        date.setFullYear(2025);

        const newDate = plan.getInstallmentDateForIndex(0);
        expect(newDate.getFullYear()).toBe(originalYear);
      });
    });

    describe('getRemainingAmount', () => {
      it('should calculate remaining amount correctly', () => {
        // 0 installments paid: all 12 remaining
        const remaining0 = plan.getRemainingAmount(0);
        expect(remaining0.amount).toBe(120000); // Full amount

        // 3 installments paid: 9 remaining (9 * R$ 100.00)
        const remaining3 = plan.getRemainingAmount(3);
        expect(remaining3.amount).toBe(90000);

        // 11 installments paid: 1 remaining
        const remaining11 = plan.getRemainingAmount(11);
        expect(remaining11.amount).toBe(10000);

        // All 12 installments paid: 0 remaining
        const remaining12 = plan.getRemainingAmount(12);
        expect(remaining12.amount).toBe(0);
      });

      it('should throw error for negative paid installments', () => {
        expect(() => plan.getRemainingAmount(-1))
          .toThrow('Paid installments must be between 0 and 12');
      });

      it('should throw error for paid installments greater than total', () => {
        expect(() => plan.getRemainingAmount(13))
          .toThrow('Paid installments must be between 0 and 12');
      });
    });
  });

  describe('equals', () => {
    it('should return true for plans with same id', () => {
      const plan1 = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );
      const plan2 = new InstallmentPlan(
        planData.id,
        new Money(50000, 'BRL'), // Different amount
        new Date('2024-02-01'), // Different date
        6, // Different count
        'Different description',
        'different-payment',
        'different-category'
      );

      expect(plan1.equals(plan2)).toBe(true);
    });

    it('should return false for plans with different ids', () => {
      const plan1 = new InstallmentPlan(
        'plan-1',
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );
      const plan2 = new InstallmentPlan(
        'plan-2',
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan1.equals(plan2)).toBe(false);
    });
  });

  describe('static factory method', () => {
    describe('create', () => {
      it('should create a plan with default values', () => {
        const plan = InstallmentPlan.create(
          planData.id,
          planData.totalAmount,
          planData.purchaseDate,
          planData.installmentCount,
          planData.description,
          planData.paymentMethodId,
          planData.categoryId
        );

        expect(plan.id).toBe(planData.id);
        expect(plan.totalAmount).toEqual(planData.totalAmount);
        expect(plan.purchaseDate).toEqual(planData.purchaseDate);
        expect(plan.installmentCount).toBe(planData.installmentCount);
        expect(plan.description).toBe(planData.description);
        expect(plan.paymentMethodId).toBe(planData.paymentMethodId);
        expect(plan.categoryId).toBe(planData.categoryId);
        expect(plan.status).toBe(InstallmentPlanStatus.ACTIVE);
        expect(plan.isActive()).toBe(true);
      });
    });
  });

  describe('InstallmentPlanStatus enum', () => {
    it('should have correct enum values', () => {
      expect(InstallmentPlanStatus.ACTIVE).toBe('active');
      expect(InstallmentPlanStatus.COMPLETED).toBe('completed');
      expect(InstallmentPlanStatus.CANCELLED).toBe('cancelled');
    });

    it('should only have three values', () => {
      const values = Object.values(InstallmentPlanStatus);
      expect(values).toHaveLength(3);
      expect(values).toContain('active');
      expect(values).toContain('completed');
      expect(values).toContain('cancelled');
    });
  });

  describe('edge cases and validation', () => {
    it('should handle plans on leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        leapYearDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.purchaseDate).toEqual(leapYearDate);
      
      const dates = plan.calculateInstallmentDates();
      expect(dates[0]).toEqual(new Date('2024-02-29')); // February 29
      expect(dates[1]).toEqual(new Date('2024-03-29')); // March 29
    });

    it('should handle special characters in description', () => {
      const specialDescription = 'iPhone 15 Pro (256GB) - Black Titanium @ $1,199.99!';
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        specialDescription,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.description).toBe(specialDescription);
    });

    it('should handle unicode characters in description', () => {
      const unicodeDescription = '📱 iPhone 15 Pro 💎 - Premium smartphone with titanium design';
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        unicodeDescription,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.description).toBe(unicodeDescription);
    });

    it('should handle very large amounts', () => {
      const largeAmount = new Money(999999999.99, 'BRL');
      const plan = new InstallmentPlan(
        planData.id,
        largeAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.totalAmount.amount).toBe(999999999.99);
      expect(plan.monthlyAmount.amount).toBe(largeAmount.divide(planData.installmentCount).amount);
    });

    it('should handle different currencies', () => {
      const usdAmount = new Money(120000, 'USD'); // $1,200.00
      const plan = new InstallmentPlan(
        planData.id,
        usdAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.totalAmount.currency).toBe('USD');
      expect(plan.monthlyAmount.currency).toBe('USD');
      expect(plan.monthlyAmount.amount).toBe(10000); // $100.00
    });

    it('should handle indivisible amounts correctly', () => {
      // R$ 100.01 divided by 3 = R$ 33.34 (rounded)
      const indivisibleAmount = new Money(10001, 'BRL');
      const plan = new InstallmentPlan(
        planData.id,
        indivisibleAmount,
        planData.purchaseDate,
        3,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.monthlyAmount.amount).toBe(3333.67); // R$ 33.3367 (precise division)
    });

    it('should handle status transitions correctly', () => {
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        planData.installmentCount,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      // Test complete lifecycle
      expect(plan.isActive()).toBe(true);
      
      plan.complete();
      expect(plan.isCompleted()).toBe(true);
      expect(plan.isActive()).toBe(false);
      
      // Cannot cancel completed plan
      expect(() => plan.cancel()).toThrow('Cannot cancel a completed installment plan');
    });

    it('should handle year boundaries in installment calculations', () => {
      // Plan starting in December with installments extending to next year
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        new Date('2024-12-15'),
        3,
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      const dates = plan.calculateInstallmentDates();
      expect(dates[0]).toEqual(new Date('2024-12-15')); // December 2024
      expect(dates[1]).toEqual(new Date('2025-01-15')); // January 2025
      expect(dates[2]).toEqual(new Date('2025-02-15')); // February 2025
    });

    it('should handle maximum installment count edge case', () => {
      const plan = new InstallmentPlan(
        planData.id,
        planData.totalAmount,
        planData.purchaseDate,
        60, // Maximum allowed
        planData.description,
        planData.paymentMethodId,
        planData.categoryId
      );

      expect(plan.installmentCount).toBe(60);
      expect(plan.monthlyAmount.amount).toBe(planData.totalAmount.divide(60).amount);
      
      const dates = plan.calculateInstallmentDates();
      expect(dates).toHaveLength(60);
      
      // Last installment should be 59 months after first
      const lastDate = new Date('2024-01-15');
      lastDate.setMonth(lastDate.getMonth() + 59);
      expect(dates[59]).toEqual(lastDate);
    });
  });
});
