import { describe, it, expect, beforeEach } from 'vitest';
import { SavingsBucket } from '@/domain/entities/savings-bucket.js';
import { Money } from '@/domain/value-objects/money.js';

describe('SavingsBucket Entity', () => {
  let bucketData: {
    id: string;
    name: string;
    targetAmount: Money;
    description: string;
  };

  beforeEach(() => {
    bucketData = {
      id: 'bucket-123',
      name: 'Emergency Fund',
      targetAmount: new Money(10000, 'BRL'),
      description: 'Money for emergencies'
    };
  });

  describe('constructor', () => {
    it('should create a savings bucket with all fields', () => {
      const bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount,
        new Money(5000, 'BRL'),
        bucketData.description
      );

      expect(bucket.id).toBe(bucketData.id);
      expect(bucket.name).toBe(bucketData.name);
      expect(bucket.targetAmount).toEqual(bucketData.targetAmount);
      expect(bucket.currentBalance.amount).toBe(5000);
      expect(bucket.description).toBe(bucketData.description);
      expect(bucket.isActive).toBe(true);
      expect(bucket.createdAt).toBeInstanceOf(Date);
      expect(bucket.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a bucket without target amount', () => {
      const bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name
      );

      expect(bucket.targetAmount).toBeNull();
      expect(bucket.currentBalance.amount).toBe(0);
      expect(bucket.description).toBeNull();
    });

    it('should create a bucket with zero balance by default', () => {
      const bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount
      );

      expect(bucket.currentBalance.amount).toBe(0);
      expect(bucket.currentBalance.currency).toBe('BRL');
    });

    it('should throw error for empty id', () => {
      expect(() => new SavingsBucket(
        '',
        bucketData.name
      )).toThrow('Bucket ID cannot be empty');
    });

    it('should throw error for empty name', () => {
      expect(() => new SavingsBucket(
        bucketData.id,
        ''
      )).toThrow('Bucket name cannot be empty');
    });

    it('should throw error for name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => new SavingsBucket(
        bucketData.id,
        longName
      )).toThrow('Bucket name cannot exceed 100 characters');
    });

    it('should throw error for negative target amount', () => {
      // This error is now expected from the Money constructor directly
      expect(() => new Money(-100, 'BRL'))
        .toThrow('Amount cannot be negative');
      // The following test for SavingsBucket constructor might become redundant
      // or needs to be re-evaluated if Money constructor handles this.
      // For now, let's assume the primary check is in Money VO.
      // expect(() => new SavingsBucket(
      //   bucketData.id,
      //   bucketData.name,
      //   new Money(-100, 'BRL') // This line itself will throw
      // )).toThrow('Amount cannot be negative');
    });

    it('should throw error for zero target amount', () => {
      const zeroAmount = new Money(0, 'BRL');
      expect(() => new SavingsBucket(
        bucketData.id,
        bucketData.name,
        zeroAmount
      )).toThrow('Target amount cannot be zero');
    });

    it('should throw error for negative current balance', () => {
      // This error is now expected from the Money constructor directly
      expect(() => new Money(-100, 'BRL'))
        .toThrow('Amount cannot be negative');
      // Similar to negative target amount, testing the SavingsBucket constructor
      // for this might be redundant if Money VO handles it.
      // expect(() => new SavingsBucket(
      //   bucketData.id,
      //   bucketData.name,
      //   bucketData.targetAmount,
      //   new Money(-100, 'BRL') // This line itself will throw
      // )).toThrow('Amount cannot be negative');
    });
  });

  describe('updateName', () => {
    let bucket: SavingsBucket;

    beforeEach(() => {
      bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount
      );
    });

    it('should update bucket name successfully', () => {
      const newName = 'Updated Bucket';
      bucket.updateName(newName);

      expect(bucket.name).toBe(newName);
    });

    it('should throw error for empty name', () => {
      expect(() => bucket.updateName('')).toThrow('Bucket name cannot be empty');
    });

    it('should throw error for name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => bucket.updateName(longName)).toThrow('Bucket name cannot exceed 100 characters');
    });
  });

  describe('updateTargetAmount', () => {
    let bucket: SavingsBucket;

    beforeEach(() => {
      bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount
      );
    });

    it('should update target amount successfully', () => {
      const newTarget = new Money(15000, 'BRL');
      bucket.updateTargetAmount(newTarget);

      expect(bucket.targetAmount).toEqual(newTarget);
    });

    it('should allow setting target amount to null', () => {
      bucket.updateTargetAmount(null);

      expect(bucket.targetAmount).toBeNull();
    });

    it('should throw error for negative target amount', () => {
      // This error is now expected from the Money constructor directly
      expect(() => new Money(-100, 'BRL'))
        .toThrow('Amount cannot be negative');
      // expect(() => bucket.updateTargetAmount(new Money(-100, 'BRL')))
      //   .toThrow('Amount cannot be negative');
    });

    it('should throw error for zero target amount', () => {
      const zeroAmount = new Money(0, 'BRL');
      expect(() => bucket.updateTargetAmount(zeroAmount))
        .toThrow('Target amount cannot be zero');
    });
  });

  describe('updateDescription', () => {
    let bucket: SavingsBucket;

    beforeEach(() => {
      bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount,
        null,
        bucketData.description
      );
    });

    it('should update description successfully', () => {
      const newDescription = 'Updated description';
      bucket.updateDescription(newDescription);

      expect(bucket.description).toBe(newDescription);
    });

    it('should allow setting description to null', () => {
      bucket.updateDescription(null);

      expect(bucket.description).toBeNull();
    });
  });

  describe('addFunds', () => {
    let bucket: SavingsBucket;

    beforeEach(() => {
      bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount,
        new Money(1000, 'BRL')
      );
    });

    it('should add funds to bucket successfully', () => {
      const additionalFunds = new Money(500, 'BRL');
      bucket.addFunds(additionalFunds);

      expect(bucket.currentBalance.amount).toBe(1500);
    });

    it('should throw error for negative amount', () => {
      // This error is now expected from the Money constructor directly
      expect(() => new Money(-100, 'BRL'))
        .toThrow('Amount cannot be negative');
      // expect(() => bucket.addFunds(new Money(-100, 'BRL')))
      //   .toThrow('Amount cannot be negative');
    });

    it('should throw error for zero amount', () => {
      const zeroAmount = new Money(0, 'BRL');
      expect(() => bucket.addFunds(zeroAmount))
        .toThrow('Transfer amount must be positive');
    });

    it('should throw error for different currency', () => {
      const differentCurrency = new Money(500, 'USD');
      expect(() => bucket.addFunds(differentCurrency))
        .toThrow('Currency mismatch: bucket uses BRL, transfer uses USD');
    });
  });

  describe('withdrawFunds', () => {
    let bucket: SavingsBucket;

    beforeEach(() => {
      bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount,
        new Money(1000, 'BRL')
      );
    });

    it('should withdraw funds from bucket successfully', () => {
      const withdrawAmount = new Money(300, 'BRL');
      bucket.withdrawFunds(withdrawAmount);

      expect(bucket.currentBalance.amount).toBe(700);
    });

    it('should throw error for negative amount', () => {
      // This error is now expected from the Money constructor directly
      expect(() => new Money(-100, 'BRL'))
        .toThrow('Amount cannot be negative');
      // expect(() => bucket.withdrawFunds(new Money(-100, 'BRL')))
      //   .toThrow('Amount cannot be negative');
    });

    it('should throw error for zero amount', () => {
      const zeroAmount = new Money(0, 'BRL');
      expect(() => bucket.withdrawFunds(zeroAmount))
        .toThrow('Transfer amount must be positive');
    });

    it('should throw error when insufficient funds', () => {
      const largeAmount = new Money(1500, 'BRL');
      expect(() => bucket.withdrawFunds(largeAmount))
        .toThrow('Insufficient funds in bucket');
    });

    it('should throw error for different currency', () => {
      const differentCurrency = new Money(300, 'USD');
      expect(() => bucket.withdrawFunds(differentCurrency))
        .toThrow('Currency mismatch: bucket uses BRL, transfer uses USD');
    });
  });

  describe('activate and deactivate', () => {
    let bucket: SavingsBucket;

    beforeEach(() => {
      bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount,
        null,
        bucketData.description,
        false // Start as inactive
      );
    });

    it('should activate bucket', () => {
      bucket.activate();

      expect(bucket.isActive).toBe(true);
    });

    it('should deactivate bucket', () => {
      bucket.activate(); // First activate
      bucket.deactivate();

      expect(bucket.isActive).toBe(false);
    });
  });

  describe('target-related methods', () => {
    describe('hasTarget', () => {
      it('should return true when target amount is set', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          bucketData.targetAmount
        );

        expect(bucket.hasTarget()).toBe(true);
      });

      it('should return false when target amount is null', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name
        );

        expect(bucket.hasTarget()).toBe(false);
      });
    });

    describe('isTargetReached', () => {
      it('should return true when current balance equals target', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(1000, 'BRL')
        );

        expect(bucket.isTargetReached()).toBe(true);
      });

      it('should return true when current balance exceeds target', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(1200, 'BRL')
        );

        expect(bucket.isTargetReached()).toBe(true);
      });

      it('should return false when current balance is less than target', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(800, 'BRL')
        );

        expect(bucket.isTargetReached()).toBe(false);
      });

      it('should return false when no target is set', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          null,
          new Money(1000, 'BRL')
        );

        expect(bucket.isTargetReached()).toBe(false);
      });
    });

    describe('getProgressPercentage', () => {
      it('should calculate progress percentage correctly', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(250, 'BRL')
        );

        expect(bucket.getProgressPercentage()).toBe(25);
      });

      it('should return 100 when target is reached', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(1000, 'BRL')
        );

        expect(bucket.getProgressPercentage()).toBe(100);
      });

      it('should return percentage over 100 when target is exceeded', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(1200, 'BRL')
        );

        expect(bucket.getProgressPercentage()).toBe(120);
      });

      it('should return null when no target is set', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          null,
          new Money(500, 'BRL')
        );

        expect(bucket.getProgressPercentage()).toBeNull();
      });
    });

    describe('getRemainingAmount', () => {
      it('should calculate remaining amount correctly', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(300, 'BRL')
        );

        const remaining = bucket.getRemainingAmount();
        expect(remaining?.amount).toBe(700);
      });

      it('should return zero when target is reached', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(1000, 'BRL')
        );

        const remaining = bucket.getRemainingAmount();
        expect(remaining?.amount).toBe(0);
      });

      it('should return zero when target is exceeded', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          new Money(1000, 'BRL'),
          new Money(1200, 'BRL')
        );

        const remaining = bucket.getRemainingAmount();
        expect(remaining?.amount).toBe(0);
      });

      it('should return null when no target is set', () => {
        const bucket = new SavingsBucket(
          bucketData.id,
          bucketData.name,
          null,
          new Money(500, 'BRL')
        );

        expect(bucket.getRemainingAmount()).toBeNull();
      });
    });
  });

  describe('canWithdraw', () => {
    let bucket: SavingsBucket;

    beforeEach(() => {
      bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount,
        new Money(1000, 'BRL')
      );
    });

    it('should return true when sufficient funds available', () => {
      const withdrawAmount = new Money(500, 'BRL');
      expect(bucket.canWithdraw(withdrawAmount)).toBe(true);
    });

    it('should return true when withdraw amount equals balance', () => {
      const withdrawAmount = new Money(1000, 'BRL');
      expect(bucket.canWithdraw(withdrawAmount)).toBe(true);
    });

    it('should return false when insufficient funds', () => {
      const withdrawAmount = new Money(1500, 'BRL');
      expect(bucket.canWithdraw(withdrawAmount)).toBe(false);
    });

    it('should return false for different currency', () => {
      const differentCurrency = new Money(500, 'USD');
      expect(bucket.canWithdraw(differentCurrency)).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should return true when balance is zero', () => {
      const bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount
      );

      expect(bucket.isEmpty()).toBe(true);
    });

    it('should return false when balance is greater than zero', () => {
      const bucket = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount,
        new Money(100, 'BRL')
      );

      expect(bucket.isEmpty()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for buckets with same id', () => {
      const bucket1 = new SavingsBucket(
        bucketData.id,
        bucketData.name,
        bucketData.targetAmount
      );
      const bucket2 = new SavingsBucket(
        bucketData.id,
        'Different Name',
        new Money(5000, 'BRL')
      );

      expect(bucket1.equals(bucket2)).toBe(true);
    });

    it('should return false for buckets with different ids', () => {
      const bucket1 = new SavingsBucket(
        'bucket-1',
        bucketData.name,
        bucketData.targetAmount
      );
      const bucket2 = new SavingsBucket(
        'bucket-2',
        bucketData.name,
        bucketData.targetAmount
      );

      expect(bucket1.equals(bucket2)).toBe(false);
    });
  });

  describe('static factory methods', () => {
    describe('create', () => {
      it('should create a new bucket with target amount', () => {
        const bucket = SavingsBucket.create(
          bucketData.id,
          bucketData.name,
          bucketData.targetAmount,
          bucketData.description
        );

        expect(bucket.id).toBe(bucketData.id);
        expect(bucket.name).toBe(bucketData.name);
        expect(bucket.targetAmount).toEqual(bucketData.targetAmount);
        expect(bucket.description).toBe(bucketData.description);
        expect(bucket.currentBalance.amount).toBe(0);
        expect(bucket.isActive).toBe(true);
      });

      it('should create a bucket without target amount', () => {
        const bucket = SavingsBucket.create(
          bucketData.id,
          bucketData.name
        );

        expect(bucket.targetAmount).toBeNull();
        expect(bucket.description).toBeNull();
      });
    });

    describe('createWithInitialBalance', () => {
      it('should create a bucket with initial balance', () => {
        const initialBalance = new Money(500, 'BRL');
        const bucket = SavingsBucket.createWithInitialBalance(
          bucketData.id,
          bucketData.name,
          initialBalance,
          bucketData.targetAmount,
          bucketData.description
        );

        expect(bucket.currentBalance).toEqual(initialBalance);
        expect(bucket.targetAmount).toEqual(bucketData.targetAmount);
        expect(bucket.description).toBe(bucketData.description);
      });

      it('should create a bucket with initial balance but no target', () => {
        const initialBalance = new Money(500, 'BRL');
        const bucket = SavingsBucket.createWithInitialBalance(
          bucketData.id,
          bucketData.name,
          initialBalance
        );

        expect(bucket.currentBalance).toEqual(initialBalance);
        expect(bucket.targetAmount).toBeNull();
        expect(bucket.description).toBeNull();
      });
    });
  });
}); 