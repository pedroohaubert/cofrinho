import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateSavingsBucketUseCase } from '@/application/use-cases/savings-bucket/create-savings-bucket.use-case.js';
import { ISavingsBucketRepository } from '@/domain/repositories/savings-bucket-repository.js';
import { SavingsBucket } from '@/domain/entities/savings-bucket.js';
import { Money } from '@/domain/value-objects/money.js';
import type { CreateSavingsBucketDTO } from '@/application/dto/savings-bucket.dto.js';

describe('CreateSavingsBucketUseCase', () => {
  let useCase: CreateSavingsBucketUseCase;
  let mockRepository: ISavingsBucketRepository;
  let validDTO: CreateSavingsBucketDTO;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findActiveBuckets: vi.fn(),
      findInactiveBuckets: vi.fn(),
      findByName: vi.fn(),
      findBucketsWithTargets: vi.fn(),
      findBucketsWithoutTargets: vi.fn(),
      findTargetReachedBuckets: vi.fn(),
      exists: vi.fn(),
      existsByName: vi.fn()
    };

    useCase = new CreateSavingsBucketUseCase(mockRepository);

    validDTO = {
      name: 'Emergency Fund',
      targetAmount: 10000,
      currency: 'BRL',
      description: 'Money for emergencies'
    };
  });

  describe('execute', () => {
    it('should create a savings bucket successfully', async () => {
      // Arrange
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validDTO);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket).toBeDefined();
      expect(result.bucket?.name).toBe(validDTO.name);
      expect(result.bucket?.targetAmount).toBe(validDTO.targetAmount);
      expect(result.bucket?.currency).toBe(validDTO.currency);
      expect(result.bucket?.description).toBe(validDTO.description);
      expect(result.bucket?.currentBalance).toBe(0);
      expect(result.bucket?.isActive).toBe(true);
      expect(result.errors).toBeUndefined();

      expect(mockRepository.findByName).toHaveBeenCalledWith(validDTO.name);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create a bucket without target amount', async () => {
      // Arrange
      const dtoWithoutTarget = {
        name: 'Emergency Fund',
        description: 'Money for emergencies'
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dtoWithoutTarget);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.targetAmount).toBeNull();
      expect(result.bucket?.remainingAmount).toBeNull();
      expect(result.bucket?.progressPercentage).toBeNull();
    });

    it('should create a bucket with initial balance', async () => {
      // Arrange
      const dtoWithInitialBalance = {
        ...validDTO,
        initialBalance: 1000
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dtoWithInitialBalance);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.currentBalance).toBe(1000);
    });

    it('should create a bucket without description', async () => {
      // Arrange
      const dtoWithoutDescription = {
        name: 'Emergency Fund',
        targetAmount: 10000,
        currency: 'BRL'
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dtoWithoutDescription);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.description).toBeNull();
    });

    it('should use BRL as default currency', async () => {
      // Arrange
      const dtoWithoutCurrency = {
        name: 'Emergency Fund',
        targetAmount: 10000
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dtoWithoutCurrency);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.currency).toBe('BRL');
    });

    it('should fail when bucket with same name already exists', async () => {
      // Arrange
      const existingBucket = SavingsBucket.create(
        'existing-bucket',
        validDTO.name,
        new Money(5000, 'BRL')
      );
      mockRepository.findByName = vi.fn().mockResolvedValue(existingBucket);

      // Act
      const result = await useCase.execute(validDTO);

      // Assert
      expect(result.success).toBe(false);
      expect(result.bucket).toBeUndefined();
      expect(result.errors).toContain('A savings bucket with this name already exists');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should succeed when bucket with same name exists but is inactive', async () => {
      // Arrange
      const inactiveBucket = SavingsBucket.create(
        'inactive-bucket',
        validDTO.name,
        new Money(5000, 'BRL')
      );
      inactiveBucket.deactivate();
      mockRepository.findByName = vi.fn().mockResolvedValue(inactiveBucket);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(validDTO);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle repository save error gracefully', async () => {
      // Arrange
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockRejectedValue(new Error('Database error'));

      // Act
      const result = await useCase.execute(validDTO);

      // Assert
      expect(result.success).toBe(false);
      expect(result.bucket).toBeUndefined();
      expect(result.errors).toContain('Failed to create savings bucket: Database error');
    });

    it('should handle repository findByName error gracefully', async () => {
      // Arrange
      mockRepository.findByName = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await useCase.execute(validDTO);

      // Assert
      expect(result.success).toBe(false);
      expect(result.bucket).toBeUndefined();
      expect(result.errors).toContain('Failed to create savings bucket: Database connection failed');
    });

    it('should generate unique bucket ID', async () => {
      // Arrange
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      const savedBuckets: SavingsBucket[] = [];
      mockRepository.save = vi.fn().mockImplementation((bucket: SavingsBucket) => {
        savedBuckets.push(bucket);
        return Promise.resolve();
      });

      // Act
      const result1 = await useCase.execute(validDTO);
      const result2 = await useCase.execute({ ...validDTO, name: 'Different Bucket' });

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(savedBuckets).toHaveLength(2);
      expect(savedBuckets[0].id).not.toBe(savedBuckets[1].id);
    });

    it('should correctly map Money objects for target and initial balance', async () => {
      // Arrange
      const dtoWithBothAmounts = {
        name: 'Test Bucket',
        targetAmount: 5000,
        currency: 'USD',
        initialBalance: 1500,
        description: 'Test bucket'
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dtoWithBothAmounts);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.targetAmount).toBe(5000);
      expect(result.bucket?.currency).toBe('USD');
      expect(result.bucket?.currentBalance).toBe(1500);
    });

    it('should calculate progress percentage correctly with initial balance', async () => {
      // Arrange
      const dtoWithProgress = {
        name: 'Progress Bucket',
        targetAmount: 1000,
        currency: 'BRL',
        initialBalance: 250
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dtoWithProgress);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.progressPercentage).toBe(25);
      expect(result.bucket?.remainingAmount).toBe(750);
      expect(result.bucket?.isTargetReached).toBe(false);
    });

    it('should handle when target is already reached with initial balance', async () => {
      // Arrange
      const dtoTargetReached = {
        name: 'Complete Bucket',
        targetAmount: 1000,
        currency: 'BRL',
        initialBalance: 1000
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(dtoTargetReached);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.progressPercentage).toBe(100);
      expect(result.bucket?.remainingAmount).toBe(0);
      expect(result.bucket?.isTargetReached).toBe(true);
    });

    it('should handle unknown errors gracefully', async () => {
      // Arrange
      mockRepository.findByName = vi.fn().mockRejectedValue('Unknown error type');

      // Act
      const result = await useCase.execute(validDTO);

      // Assert
      expect(result.success).toBe(false);
      expect(result.bucket).toBeUndefined();
      expect(result.errors).toContain('Failed to create savings bucket: Unknown error');
    });
  });

  describe('edge cases', () => {
    it('should handle very large target amounts', async () => {
      // Arrange
      const largeAmountDTO = {
        ...validDTO,
        targetAmount: 999999999.99
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(largeAmountDTO);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.targetAmount).toBe(999999999.99);
    });

    it('should handle special characters in bucket name', async () => {
      // Arrange
      const specialNameDTO = {
        ...validDTO,
        name: 'Emergency Fund (🚨) - $10K Goal!'
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(specialNameDTO);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.name).toBe(specialNameDTO.name);
    });

    it('should handle very long descriptions', async () => {
      // Arrange
      const longDescriptionDTO = {
        ...validDTO,
        description: 'A'.repeat(1000) // Very long description
      };
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(longDescriptionDTO);

      // Assert
      expect(result.success).toBe(true);
      expect(result.bucket?.description).toBe(longDescriptionDTO.description);
    });

    it('should handle different currency codes', async () => {
      // Arrange
      const currencyVariations = ['USD', 'EUR', 'GBP', 'JPY', 'BRL'];
      mockRepository.findByName = vi.fn().mockResolvedValue(null);
      mockRepository.save = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      for (const currency of currencyVariations) {
        const result = await useCase.execute({
          name: `Bucket ${currency}`,
          targetAmount: 1000,
          currency
        });

        expect(result.success).toBe(true);
        expect(result.bucket?.currency).toBe(currency);
      }
    });
  });
}); 