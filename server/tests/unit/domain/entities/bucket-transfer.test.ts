import { describe, it, expect, beforeEach } from 'vitest';
import { BucketTransfer, BucketTransferType } from '@/domain/entities/bucket-transfer.js';
import { Money } from '@/domain/value-objects/money.js';

describe('BucketTransfer Entity', () => {
  let transferData: {
    id: string;
    date: Date;
    amount: Money;
    type: BucketTransferType;
    bucketId: string;
    description: string;
  };

  beforeEach(() => {
    transferData = {
      id: 'transfer-123',
      date: new Date('2024-01-15'),
      amount: new Money(50000, 'BRL'), // R$ 500.00
      type: BucketTransferType.DEPOSIT,
      bucketId: 'bucket-emergency',
      description: 'Monthly emergency fund contribution'
    };
  });

  describe('constructor', () => {
    it('should create a transfer with all required fields', () => {
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      expect(transfer.id).toBe(transferData.id);
      expect(transfer.date).toEqual(transferData.date);
      expect(transfer.amount).toEqual(transferData.amount);
      expect(transfer.type).toBe(transferData.type);
      expect(transfer.bucketId).toBe(transferData.bucketId);
      expect(transfer.description).toBe(transferData.description);
      expect(transfer.createdAt).toBeInstanceOf(Date);
      expect(transfer.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a transfer without description', () => {
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId
      );

      expect(transfer.description).toBeNull();
    });

    it('should create a transfer with null description', () => {
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        null
      );

      expect(transfer.description).toBeNull();
    });

    it('should create a transfer with custom created and updated dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description,
        createdAt,
        updatedAt
      );

      expect(transfer.createdAt).toEqual(createdAt);
      expect(transfer.updatedAt).toEqual(updatedAt);
    });

    it('should trim whitespace from description', () => {
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        '  Monthly emergency fund contribution  '
      );

      expect(transfer.description).toBe('Monthly emergency fund contribution');
    });

    it('should convert empty string description to null', () => {
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        ''
      );

      expect(transfer.description).toBeNull();
    });

    it('should convert whitespace-only description to null', () => {
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        '   '
      );

      expect(transfer.description).toBeNull();
    });
  });

  describe('constructor validation', () => {
    it('should throw error for empty id', () => {
      expect(() => new BucketTransfer(
        '',
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      )).toThrow('Transfer ID cannot be empty');
    });

    it('should throw error for whitespace-only id', () => {
      expect(() => new BucketTransfer(
        '   ',
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      )).toThrow('Transfer ID cannot be empty');
    });

    it('should throw error for invalid date', () => {
      expect(() => new BucketTransfer(
        transferData.id,
        new Date('invalid'),
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      )).toThrow('Invalid transfer date');
    });

    it('should throw error for date more than 1 year in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      
      expect(() => new BucketTransfer(
        transferData.id,
        futureDate,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      )).toThrow('Transfer date cannot be more than 1 year in the future');
    });

    it('should accept date just under 1 year in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      futureDate.setDate(futureDate.getDate() - 1); // Just under 1 year
      
      const transfer = new BucketTransfer(
        transferData.id,
        futureDate,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      expect(transfer.date).toEqual(futureDate);
    });

    it('should throw error for zero amount', () => {
      const zeroAmount = new Money(0, 'BRL');
      expect(() => new BucketTransfer(
        transferData.id,
        transferData.date,
        zeroAmount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      )).toThrow('Transfer amount must be positive');
    });

    it('should throw error for negative amount', () => {
      // Since Money constructor throws for negative amounts, we test that too
      expect(() => {
        const negativeAmount = new Money(-1000, 'BRL');
        new BucketTransfer(
          transferData.id,
          transferData.date,
          negativeAmount,
          transferData.type,
          transferData.bucketId,
          transferData.description
        );
      }).toThrow('Amount cannot be negative');
    });

    it('should throw error for invalid transfer type', () => {
      expect(() => new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        'invalid_type' as BucketTransferType,
        transferData.bucketId,
        transferData.description
      )).toThrow('Invalid transfer type: invalid_type');
    });

    it('should throw error for empty bucket id', () => {
      expect(() => new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        '',
        transferData.description
      )).toThrow('Bucket ID cannot be empty');
    });

    it('should throw error for whitespace-only bucket id', () => {
      expect(() => new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        '   ',
        transferData.description
      )).toThrow('Bucket ID cannot be empty');
    });
  });

  describe('getters', () => {
    let transfer: BucketTransfer;

    beforeEach(() => {
      transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );
    });

    it('should return immutable date objects', () => {
      const date1 = transfer.date;
      const date2 = transfer.date;
      
      expect(date1).toEqual(date2);
      expect(date1).not.toBe(date2); // Different instances
      
      date1.setFullYear(2025);
      expect(transfer.date.getFullYear()).toBe(2024); // Original unchanged
    });

    it('should return immutable created and updated date objects', () => {
      const createdAt1 = transfer.createdAt;
      const createdAt2 = transfer.createdAt;
      const originalYear = createdAt1.getFullYear();
      
      expect(createdAt1).toEqual(createdAt2);
      expect(createdAt1).not.toBe(createdAt2);
      
      createdAt1.setFullYear(2025);
      expect(transfer.createdAt.getFullYear()).toBe(originalYear);
    });
  });

  describe('updateDescription', () => {
    let transfer: BucketTransfer;

    beforeEach(() => {
      transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );
    });

    it('should update description successfully', () => {
      const newDescription = 'Updated emergency fund contribution';
      const oldUpdatedAt = transfer.updatedAt;

      transfer.updateDescription(newDescription);

      expect(transfer.description).toBe(newDescription);
      expect(transfer.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });

    it('should trim whitespace when updating description', () => {
      transfer.updateDescription('  Updated emergency fund contribution  ');

      expect(transfer.description).toBe('Updated emergency fund contribution');
    });

    it('should set description to null when given empty string', () => {
      transfer.updateDescription('');

      expect(transfer.description).toBeNull();
    });

    it('should set description to null when given whitespace-only string', () => {
      transfer.updateDescription('   ');

      expect(transfer.description).toBeNull();
    });

    it('should set description to null when given null', () => {
      transfer.updateDescription(null);

      expect(transfer.description).toBeNull();
    });

    it('should update updatedAt when description changes', () => {
      const oldUpdatedAt = transfer.updatedAt;
      
      transfer.updateDescription('New description');

      expect(transfer.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
    });
  });

  describe('type checking methods', () => {
    it('should identify deposits correctly', () => {
      const deposit = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        BucketTransferType.DEPOSIT,
        transferData.bucketId,
        transferData.description
      );

      expect(deposit.isDeposit()).toBe(true);
      expect(deposit.isWithdrawal()).toBe(false);
    });

    it('should identify withdrawals correctly', () => {
      const withdrawal = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        BucketTransferType.WITHDRAWAL,
        transferData.bucketId,
        transferData.description
      );

      expect(withdrawal.isDeposit()).toBe(false);
      expect(withdrawal.isWithdrawal()).toBe(true);
    });
  });

  describe('date filtering methods', () => {
    let transfer: BucketTransfer;

    beforeEach(() => {
      // Transfer on January 15, 2024
      transfer = new BucketTransfer(
        transferData.id,
        new Date('2024-01-15'),
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );
    });

    describe('isInMonth', () => {
      it('should return true for correct month and year', () => {
        expect(transfer.isInMonth(2024, 1)).toBe(true); // January 2024
      });

      it('should return false for wrong month', () => {
        expect(transfer.isInMonth(2024, 2)).toBe(false); // February 2024
      });

      it('should return false for wrong year', () => {
        expect(transfer.isInMonth(2023, 1)).toBe(false); // January 2023
      });

      it('should return false for wrong month and year', () => {
        expect(transfer.isInMonth(2023, 2)).toBe(false); // February 2023
      });
    });

    describe('isInYear', () => {
      it('should return true for correct year', () => {
        expect(transfer.isInYear(2024)).toBe(true);
      });

      it('should return false for wrong year', () => {
        expect(transfer.isInYear(2023)).toBe(false);
        expect(transfer.isInYear(2025)).toBe(false);
      });
    });

    describe('isInDateRange', () => {
      it('should return true when transfer date is within range', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        
        expect(transfer.isInDateRange(startDate, endDate)).toBe(true);
      });

      it('should return true when transfer date equals start date', () => {
        const startDate = new Date('2024-01-15');
        const endDate = new Date('2024-01-31');
        
        expect(transfer.isInDateRange(startDate, endDate)).toBe(true);
      });

      it('should return true when transfer date equals end date', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-15');
        
        expect(transfer.isInDateRange(startDate, endDate)).toBe(true);
      });

      it('should return false when transfer date is before range', () => {
        const startDate = new Date('2024-01-16');
        const endDate = new Date('2024-01-31');
        
        expect(transfer.isInDateRange(startDate, endDate)).toBe(false);
      });

      it('should return false when transfer date is after range', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-14');
        
        expect(transfer.isInDateRange(startDate, endDate)).toBe(false);
      });
    });
  });

  describe('equals', () => {
    it('should return true for transfers with same id', () => {
      const transfer1 = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );
      const transfer2 = new BucketTransfer(
        transferData.id,
        new Date('2024-02-01'), // Different date
        new Money(25000, 'BRL'), // Different amount
        BucketTransferType.WITHDRAWAL, // Different type
        'different-bucket',
        'Different description'
      );

      expect(transfer1.equals(transfer2)).toBe(true);
    });

    it('should return false for transfers with different ids', () => {
      const transfer1 = new BucketTransfer(
        'transfer-1',
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );
      const transfer2 = new BucketTransfer(
        'transfer-2',
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      expect(transfer1.equals(transfer2)).toBe(false);
    });
  });

  describe('static factory methods', () => {
    describe('createDeposit', () => {
      it('should create a deposit transfer with description', () => {
        const deposit = BucketTransfer.createDeposit(
          transferData.id,
          transferData.date,
          transferData.amount,
          transferData.bucketId,
          transferData.description
        );

        expect(deposit.id).toBe(transferData.id);
        expect(deposit.date).toEqual(transferData.date);
        expect(deposit.amount).toEqual(transferData.amount);
        expect(deposit.type).toBe(BucketTransferType.DEPOSIT);
        expect(deposit.bucketId).toBe(transferData.bucketId);
        expect(deposit.description).toBe(transferData.description);
        expect(deposit.isDeposit()).toBe(true);
        expect(deposit.isWithdrawal()).toBe(false);
      });

      it('should create a deposit transfer without description', () => {
        const deposit = BucketTransfer.createDeposit(
          transferData.id,
          transferData.date,
          transferData.amount,
          transferData.bucketId
        );

        expect(deposit.description).toBeNull();
        expect(deposit.type).toBe(BucketTransferType.DEPOSIT);
      });
    });

    describe('createWithdrawal', () => {
      it('should create a withdrawal transfer with description', () => {
        const withdrawal = BucketTransfer.createWithdrawal(
          transferData.id,
          transferData.date,
          transferData.amount,
          transferData.bucketId,
          transferData.description
        );

        expect(withdrawal.id).toBe(transferData.id);
        expect(withdrawal.date).toEqual(transferData.date);
        expect(withdrawal.amount).toEqual(transferData.amount);
        expect(withdrawal.type).toBe(BucketTransferType.WITHDRAWAL);
        expect(withdrawal.bucketId).toBe(transferData.bucketId);
        expect(withdrawal.description).toBe(transferData.description);
        expect(withdrawal.isDeposit()).toBe(false);
        expect(withdrawal.isWithdrawal()).toBe(true);
      });

      it('should create a withdrawal transfer without description', () => {
        const withdrawal = BucketTransfer.createWithdrawal(
          transferData.id,
          transferData.date,
          transferData.amount,
          transferData.bucketId
        );

        expect(withdrawal.description).toBeNull();
        expect(withdrawal.type).toBe(BucketTransferType.WITHDRAWAL);
      });
    });
  });

  describe('BucketTransferType enum', () => {
    it('should have correct enum values', () => {
      expect(BucketTransferType.DEPOSIT).toBe('deposit');
      expect(BucketTransferType.WITHDRAWAL).toBe('withdrawal');
    });

    it('should only have two values', () => {
      const values = Object.values(BucketTransferType);
      expect(values).toHaveLength(2);
      expect(values).toContain('deposit');
      expect(values).toContain('withdrawal');
    });
  });

  describe('edge cases and validation', () => {
    it('should handle transfers on leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      const transfer = new BucketTransfer(
        transferData.id,
        leapYearDate,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      expect(transfer.date).toEqual(leapYearDate);
      expect(transfer.isInMonth(2024, 2)).toBe(true);
    });

    it('should handle special characters in description', () => {
      const specialDescription = 'Emergency fund: $500 deposit @ 15/01/2024 (monthly contribution)!';
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        specialDescription
      );

      expect(transfer.description).toBe(specialDescription);
    });

    it('should handle unicode characters in description', () => {
      const unicodeDescription = '💰 Emergency fund contribution 📈 - building financial safety net';
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        unicodeDescription
      );

      expect(transfer.description).toBe(unicodeDescription);
    });

    it('should handle very large amounts', () => {
      const largeAmount = new Money(999999999.99, 'BRL');
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        largeAmount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      expect(transfer.amount.amount).toBe(999999999.99);
    });

    it('should handle different currencies', () => {
      const usdAmount = new Money(50000, 'USD'); // $500.00
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        usdAmount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      expect(transfer.amount.currency).toBe('USD');
      expect(transfer.amount.amount).toBe(50000);
    });

    it('should handle very long descriptions', () => {
      // Test with a reasonably long description (not exceeding typical database limits)
      const longDescription = 'This is a very long description that details exactly why this transfer was made to the emergency fund bucket. It includes information about the source of the money, the date, the amount, and the specific purpose for which these funds are being saved. This kind of detailed description helps with financial tracking and budgeting analysis over time.';
      
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        longDescription
      );

      expect(transfer.description).toBe(longDescription);
    });

    it('should handle date range edge cases', () => {
      const transfer = new BucketTransfer(
        transferData.id,
        new Date('2024-01-15T23:59:59.999Z'), // End of day
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      // Should still be in January 15th regardless of time
      expect(transfer.isInMonth(2024, 1)).toBe(true);
      expect(transfer.isInDateRange(
        new Date('2024-01-15T00:00:00.000Z'),
        new Date('2024-01-15T23:59:59.999Z')
      )).toBe(true);
    });

    it('should handle year boundaries correctly', () => {
      const newYearTransfer = new BucketTransfer(
        transferData.id,
        new Date('2024-01-01'), // First day of year
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      expect(newYearTransfer.isInYear(2024)).toBe(true);
      expect(newYearTransfer.isInYear(2023)).toBe(false);
      expect(newYearTransfer.isInMonth(2024, 1)).toBe(true);
      expect(newYearTransfer.isInMonth(2023, 12)).toBe(false);
    });

    it('should handle description updates correctly', () => {
      const transfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        transferData.amount,
        transferData.type,
        transferData.bucketId,
        'Original description'
      );

      // Update to new description
      transfer.updateDescription('New description');
      expect(transfer.description).toBe('New description');

      // Update to null
      transfer.updateDescription(null);
      expect(transfer.description).toBeNull();

      // Update to empty string (should become null)
      transfer.updateDescription('');
      expect(transfer.description).toBeNull();

      // Update back to valid description
      transfer.updateDescription('Final description');
      expect(transfer.description).toBe('Final description');
    });

    it('should handle edge case amounts correctly', () => {
      // Very small amount (1 cent)
      const smallAmount = new Money(1, 'BRL');
      const smallTransfer = new BucketTransfer(
        transferData.id,
        transferData.date,
        smallAmount,
        transferData.type,
        transferData.bucketId,
        transferData.description
      );

      expect(smallTransfer.amount.amount).toBe(1);
      expect(smallTransfer.amount.currency).toBe('BRL');
    });
  });
}); 