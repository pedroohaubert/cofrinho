import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransferToBucketUseCase } from '@/application/use-cases/savings-bucket/transfer-to-bucket.use-case.js';
import { ISavingsBucketRepository } from '@/domain/repositories/savings-bucket-repository.js';
import { SavingsBucketService } from '@/domain/services/savings-bucket-service.js';
import { SavingsBucket } from '@/domain/entities/savings-bucket.js';
import { BucketTransfer, BucketTransferType } from '@/domain/entities/bucket-transfer.js';
import { Money } from '@/domain/value-objects/money.js';
import { TransferToBucketDTO } from '@/application/dto/savings-bucket.dto.js';

describe('TransferToBucketUseCase', () => {
  let useCase: TransferToBucketUseCase;
  let mockSavingsBucketRepo: vi.Mocked<ISavingsBucketRepository>;
  let mockSavingsBucketService: vi.Mocked<SavingsBucketService>;

  // Test buckets
  let activeBucket: SavingsBucket;
  let inactiveBucket: SavingsBucket;
  let bucketWithTarget: SavingsBucket;
  let lowBalanceBucket: SavingsBucket;

  beforeEach(() => {
    // Create test buckets
    activeBucket = SavingsBucket.create(
      'bucket-active',
      'Emergency Fund',
      new Money(1000, 'BRL'),
      new Money(5000, 'BRL'),
      'Emergency savings bucket'
    );

    inactiveBucket = SavingsBucket.create(
      'bucket-inactive',
      'Inactive Bucket',
      new Money(500, 'BRL'),
      new Money(2000, 'BRL'),
      'Inactive bucket'
    );
    inactiveBucket.deactivate();

    bucketWithTarget = SavingsBucket.create(
      'bucket-target',
      'Vacation Fund',
      new Money(3000, 'BRL'),
      new Money(10000, 'BRL'),
      'Vacation savings'
    );

    lowBalanceBucket = SavingsBucket.create(
      'bucket-low',
      'Low Balance Bucket',
      new Money(50, 'BRL'),
      new Money(1000, 'BRL'),
      'Low balance bucket'
    );

    // Setup mock repository
    mockSavingsBucketRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findActive: vi.fn(),
      findInactive: vi.fn(),
      findByName: vi.fn(),
      findByBalanceRange: vi.fn(),
      findWithTargets: vi.fn(),
      findWithoutTargets: vi.fn(),
      getTotalBalance: vi.fn(),
      exists: vi.fn(),
      existsByName: vi.fn(),
    };

    // Setup mock service
    mockSavingsBucketService = {
      depositToBucket: vi.fn(),
      withdrawFromBucket: vi.fn(),
      transferBetweenBuckets: vi.fn(),
      calculateProgress: vi.fn(),
      canWithdraw: vi.fn(),
      validateTransfer: vi.fn(),
    } as any;

    useCase = new TransferToBucketUseCase(mockSavingsBucketRepo, mockSavingsBucketService);
  });

  describe('execute', () => {
    describe('successful deposits', () => {
      it('should deposit to active bucket successfully', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 500,
          currency: 'BRL',
          description: 'Monthly savings',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-1',
          new Date(),
          new Money(500, 'BRL'),
          'bucket-active',
          'Monthly savings'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer).toBeDefined();
        expect(result.transfer?.type).toBe('deposit');
        expect(result.transfer?.amount).toBe(500);
        expect(result.transfer?.currency).toBe('BRL');
        expect(result.transfer?.description).toBe('Monthly savings');
        expect(result.errors).toBeUndefined();

        // Verify service call
        expect(mockSavingsBucketService.depositToBucket).toHaveBeenCalledWith(
          'bucket-active',
          new Money(500, 'BRL'),
          'Monthly savings'
        );
      });

      it('should deposit to bucket without description', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 250,
          currency: 'BRL',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-2',
          new Date(),
          new Money(250, 'BRL'),
          'bucket-active',
          null
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.description).toBeNull();

        // Verify service called with undefined description
        expect(mockSavingsBucketService.depositToBucket).toHaveBeenCalledWith(
          'bucket-active',
          new Money(250, 'BRL'),
          undefined
        );
      });

      it('should deposit large amount to bucket', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 10000,
          currency: 'BRL',
          description: 'Large deposit',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-large',
          new Date(),
          new Money(10000, 'BRL'),
          'bucket-active',
          'Large deposit'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.amount).toBe(10000);
      });

      it('should deposit with different currency', async () => {
        const bucketUSD = SavingsBucket.create(
          'bucket-usd',
          'USD Bucket',
          new Money(100, 'USD'),
          new Money(1000, 'USD'),
          'USD savings'
        );

        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 50,
          currency: 'USD',
          description: 'USD deposit',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-usd',
          new Date(),
          new Money(50, 'USD'),
          'bucket-usd',
          'USD deposit'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(bucketUSD);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-usd', depositDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.currency).toBe('USD');
      });
    });

    describe('successful withdrawals', () => {
      it('should withdraw from bucket with sufficient funds', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 300,
          currency: 'BRL',
          description: 'Emergency expense',
        };

        const mockTransfer = BucketTransfer.createWithdrawal(
          'transfer-withdrawal',
          new Date(),
          new Money(300, 'BRL'),
          'bucket-active',
          'Emergency expense'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.withdrawFromBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', withdrawalDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer).toBeDefined();
        expect(result.transfer?.type).toBe('withdrawal');
        expect(result.transfer?.amount).toBe(300);
        expect(result.transfer?.description).toBe('Emergency expense');

        // Verify service call
        expect(mockSavingsBucketService.withdrawFromBucket).toHaveBeenCalledWith(
          'bucket-active',
          new Money(300, 'BRL'),
          'Emergency expense'
        );
      });

      it('should withdraw from bucket without description', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 200,
          currency: 'BRL',
        };

        const mockTransfer = BucketTransfer.createWithdrawal(
          'transfer-withdrawal-no-desc',
          new Date(),
          new Money(200, 'BRL'),
          'bucket-active',
          null
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.withdrawFromBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', withdrawalDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.description).toBeNull();
      });

      it('should withdraw entire bucket balance', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 1000, // Entire balance
          currency: 'BRL',
          description: 'Complete withdrawal',
        };

        const mockTransfer = BucketTransfer.createWithdrawal(
          'transfer-complete',
          new Date(),
          new Money(1000, 'BRL'),
          'bucket-active',
          'Complete withdrawal'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.withdrawFromBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', withdrawalDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.amount).toBe(1000);
      });
    });

    describe('bucket validation', () => {
      it('should fail when bucket not found', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 500,
          currency: 'BRL',
          description: 'Deposit to non-existent bucket',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('non-existent-bucket', depositDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Savings bucket not found']);
        expect(result.transfer).toBeUndefined();
        expect(mockSavingsBucketService.depositToBucket).not.toHaveBeenCalled();
      });

      it('should fail when bucket is inactive', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 500,
          currency: 'BRL',
          description: 'Deposit to inactive bucket',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(inactiveBucket);

        // Execute
        const result = await useCase.execute('bucket-inactive', depositDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Savings bucket is not active']);
        expect(result.transfer).toBeUndefined();
        expect(mockSavingsBucketService.depositToBucket).not.toHaveBeenCalled();
      });
    });

    describe('insufficient funds validation', () => {
      it('should fail withdrawal when insufficient funds', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 100, // More than the bucket balance (50)
          currency: 'BRL',
          description: 'Overdraft attempt',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(lowBalanceBucket);

        // Execute
        const result = await useCase.execute('bucket-low', withdrawalDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Insufficient funds in bucket for withdrawal']);
        expect(result.transfer).toBeUndefined();
        expect(mockSavingsBucketService.withdrawFromBucket).not.toHaveBeenCalled();
      });

      it('should fail withdrawal when amount equals but exceeds balance', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 51, // Just slightly more than balance (50)
          currency: 'BRL',
          description: 'Slight overdraft',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(lowBalanceBucket);

        // Execute
        const result = await useCase.execute('bucket-low', withdrawalDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Insufficient funds in bucket for withdrawal']);
      });

      it('should succeed withdrawal when amount equals balance exactly', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 50, // Exact balance
          currency: 'BRL',
          description: 'Exact balance withdrawal',
        };

        const mockTransfer = BucketTransfer.createWithdrawal(
          'transfer-exact',
          new Date(),
          new Money(50, 'BRL'),
          'bucket-low',
          'Exact balance withdrawal'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(lowBalanceBucket);
        mockSavingsBucketService.withdrawFromBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-low', withdrawalDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.amount).toBe(50);
      });
    });

    describe('error handling', () => {
      it('should handle repository findById errors gracefully', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 500,
          currency: 'BRL',
          description: 'Test deposit',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockRejectedValue(new Error('Database connection failed'));

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to process transfer: Database connection failed']);
        expect(result.transfer).toBeUndefined();
      });

      it('should handle service deposit errors gracefully', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 500,
          currency: 'BRL',
          description: 'Test deposit',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockRejectedValue(new Error('Service error'));

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to process transfer: Service error']);
        expect(result.transfer).toBeUndefined();
      });

      it('should handle service withdrawal errors gracefully', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 300,
          currency: 'BRL',
          description: 'Test withdrawal',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.withdrawFromBucket.mockRejectedValue(new Error('Withdrawal service error'));

        // Execute
        const result = await useCase.execute('bucket-active', withdrawalDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to process transfer: Withdrawal service error']);
        expect(result.transfer).toBeUndefined();
      });

      it('should handle unknown errors gracefully', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 500,
          currency: 'BRL',
          description: 'Test deposit',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to process transfer: Unknown error']);
        expect(result.transfer).toBeUndefined();
      });
    });

    describe('domain object creation', () => {
      it('should create correct Money domain object from DTO', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 123.45,
          currency: 'USD',
          description: 'Test amount conversion',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-test',
          new Date(),
          new Money(123.45, 'USD'),
          'bucket-active',
          'Test amount conversion'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify service was called with correct Money object
        expect(mockSavingsBucketService.depositToBucket).toHaveBeenCalledWith(
          'bucket-active',
          expect.objectContaining({
            amount: 123.45,
            currency: 'USD',
          }),
          'Test amount conversion'
        );
        expect(result.success).toBe(true);
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTO for deposit', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 500,
          currency: 'BRL',
          description: 'Response mapping test',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-response',
          new Date('2024-01-15T10:30:00.000Z'),
          new Money(500, 'BRL'),
          'bucket-active',
          'Response mapping test'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify response structure
        expect(result.success).toBe(true);
        expect(result.transfer).toBeDefined();
        expect(result.transfer).toHaveProperty('id');
        expect(result.transfer).toHaveProperty('date');
        expect(result.transfer).toHaveProperty('amount');
        expect(result.transfer).toHaveProperty('currency');
        expect(result.transfer).toHaveProperty('type');
        expect(result.transfer).toHaveProperty('bucketId');
        expect(result.transfer).toHaveProperty('description');
        expect(result.transfer).toHaveProperty('createdAt');
        expect(result.transfer).toHaveProperty('updatedAt');

        // Verify dates are ISO strings
        expect(result.transfer!.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.transfer!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.transfer!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should return properly formatted response DTO for withdrawal', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 300,
          currency: 'BRL',
          description: 'Withdrawal response test',
        };

        const mockTransfer = BucketTransfer.createWithdrawal(
          'transfer-withdrawal-response',
          new Date('2024-01-15T14:45:00.000Z'),
          new Money(300, 'BRL'),
          'bucket-active',
          'Withdrawal response test'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.withdrawFromBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', withdrawalDTO);

        // Verify response structure
        expect(result.success).toBe(true);
        expect(result.transfer?.type).toBe('withdrawal');
        expect(result.transfer?.amount).toBe(300);
        expect(result.transfer?.description).toBe('Withdrawal response test');
      });
    });

    describe('edge cases', () => {
      it('should handle zero amount deposit', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 0,
          currency: 'BRL',
          description: 'Zero deposit',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-zero',
          new Date(),
          new Money(0, 'BRL'),
          'bucket-active',
          'Zero deposit'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.amount).toBe(0);
      });

      it('should handle zero amount withdrawal', async () => {
        const withdrawalDTO: TransferToBucketDTO = {
          type: 'withdrawal',
          amount: 0,
          currency: 'BRL',
          description: 'Zero withdrawal',
        };

        const mockTransfer = BucketTransfer.createWithdrawal(
          'transfer-zero-withdrawal',
          new Date(),
          new Money(0, 'BRL'),
          'bucket-active',
          'Zero withdrawal'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.withdrawFromBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', withdrawalDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.amount).toBe(0);
      });

      it('should handle very long description', async () => {
        const longDescription = 'A'.repeat(500);
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 100,
          currency: 'BRL',
          description: longDescription,
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-long-desc',
          new Date(),
          new Money(100, 'BRL'),
          'bucket-active',
          longDescription
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.description).toBe(longDescription);
      });

      it('should handle special characters in bucket ID', async () => {
        const specialBucket = SavingsBucket.create(
          'bucket-special-äöü-123',
          'Special Bucket',
          new Money(100, 'BRL'),
          new Money(1000, 'BRL'),
          'Special character bucket'
        );

        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 100,
          currency: 'BRL',
          description: 'Special bucket deposit',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-special',
          new Date(),
          new Money(100, 'BRL'),
          'bucket-special-äöü-123',
          'Special bucket deposit'
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(specialBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-special-äöü-123', depositDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.transfer?.bucketId).toBe('bucket-special-äöü-123');
      });
    });

    describe('response format', () => {
      it('should return success response with transfer property', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 100,
          currency: 'BRL',
        };

        const mockTransfer = BucketTransfer.createDeposit(
          'transfer-format',
          new Date(),
          new Money(100, 'BRL'),
          'bucket-active',
          null
        );

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(activeBucket);
        mockSavingsBucketService.depositToBucket.mockResolvedValue(mockTransfer);

        // Execute
        const result = await useCase.execute('bucket-active', depositDTO);

        // Verify response structure
        expect(result).toEqual({
          success: true,
          transfer: expect.objectContaining({
            id: expect.any(String),
            type: 'deposit',
            amount: 100,
            currency: 'BRL',
          }),
        });
        expect(result).not.toHaveProperty('data');
        expect(result.errors).toBeUndefined();
      });

      it('should return error response with proper structure', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 100,
          currency: 'BRL',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('non-existent', depositDTO);

        // Verify response structure
        expect(result).toEqual({
          success: false,
          errors: ['Savings bucket not found'],
        });
        expect(result).not.toHaveProperty('transfer');
        expect(result).not.toHaveProperty('data');
      });

      it('should return single error in array format', async () => {
        const depositDTO: TransferToBucketDTO = {
          type: 'deposit',
          amount: 100,
          currency: 'BRL',
        };

        // Setup mocks
        mockSavingsBucketRepo.findById.mockResolvedValue(inactiveBucket);

        // Execute
        const result = await useCase.execute('bucket-inactive', depositDTO);

        // Verify error is in array format
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors).toHaveLength(1);
        expect(typeof result.errors?.[0]).toBe('string');
      });
    });
  });
}); 