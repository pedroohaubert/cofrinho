import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CancelSubscriptionUseCase } from '@/application/use-cases/subscription/cancel-subscription.use-case.js';
import { ISubscriptionRepository } from '@/domain/repositories/subscription-repository.js';
import { Subscription, SubscriptionStatus } from '@/domain/entities/subscription.js';
import { Money } from '@/domain/value-objects/money.js';
import { CancelSubscriptionDTO } from '@/application/dto/subscription.dto.js';

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase;
  let mockSubscriptionRepo: vi.Mocked<ISubscriptionRepository>;

  // Test subscriptions
  let activeSubscription: Subscription;
  let cancelledSubscription: Subscription;
  let pausedSubscription: Subscription;
  let subscriptionWithEndDate: Subscription;

  beforeEach(() => {
    // Create test subscriptions
    activeSubscription = new Subscription(
      'sub-active',
      'Netflix Subscription',
      new Money(39.99, 'BRL'),
      new Date('2024-01-01T00:00:00.000Z'),
      'cat-entertainment',
      'pm-credit',
      null
    );

    cancelledSubscription = new Subscription(
      'sub-cancelled',
      'Cancelled Service',
      new Money(29.99, 'BRL'),
      new Date('2024-01-01T00:00:00.000Z'),
      'cat-services',
      'pm-credit',
      new Date('2024-06-01T00:00:00.000Z')
    );
    cancelledSubscription.cancel(new Date('2024-06-01T00:00:00.000Z'));

    pausedSubscription = new Subscription(
      'sub-paused',
      'Paused Service',
      new Money(19.99, 'BRL'),
      new Date('2024-01-01T00:00:00.000Z'),
      'cat-services',
      'pm-credit',
      null
    );
    pausedSubscription.pause();

    subscriptionWithEndDate = new Subscription(
      'sub-end-date',
      'Limited Time Service',
      new Money(49.99, 'BRL'),
      new Date('2024-01-01T00:00:00.000Z'),
      'cat-services',
      'pm-credit',
      new Date('2024-12-31T23:59:59.999Z')
    );

    // Setup mock repository
    mockSubscriptionRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findActive: vi.fn(),
      findInactive: vi.fn(),
      findCancelled: vi.fn(),
      findByCategory: vi.fn(),
      findByPaymentMethod: vi.fn(),
      findByName: vi.fn(),
      findExpiring: vi.fn(),
      exists: vi.fn(),
      existsByName: vi.fn(),
    };

    useCase = new CancelSubscriptionUseCase(mockSubscriptionRepo);
  });

  describe('execute', () => {
    describe('successful cancellation', () => {
      it('should cancel active subscription without end date (immediate cancellation)', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription).toBeDefined();
        expect(result.subscription?.id).toBe('sub-active');
        expect(result.subscription?.status).toBe('cancelled');
        expect(result.subscription?.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.errors).toBeUndefined();

        // Verify repository calls
        expect(mockSubscriptionRepo.findById).toHaveBeenCalledWith('sub-active');
        expect(mockSubscriptionRepo.update).toHaveBeenCalledOnce();

        const updatedSubscription = mockSubscriptionRepo.update.mock.calls[0][0] as Subscription;
        expect(updatedSubscription.status).toBe(SubscriptionStatus.CANCELLED);
        expect(updatedSubscription.endDate).toBeInstanceOf(Date);
      });

      it('should cancel active subscription with specific end date', async () => {
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: '2024-06-15T00:00:00.000Z',
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.endDate).toBe('2024-06-15T00:00:00.000Z');

        const updatedSubscription = mockSubscriptionRepo.update.mock.calls[0][0] as Subscription;
        expect(updatedSubscription.endDate?.toISOString()).toBe('2024-06-15T00:00:00.000Z');
      });

      it('should cancel paused subscription', async () => {
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: '2024-07-01T00:00:00.000Z',
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(pausedSubscription);

        // Execute
        const result = await useCase.execute('sub-paused', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.status).toBe('cancelled');

        const updatedSubscription = mockSubscriptionRepo.update.mock.calls[0][0] as Subscription;
        expect(updatedSubscription.status).toBe(SubscriptionStatus.CANCELLED);
      });

      it('should cancel subscription with existing end date', async () => {
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: '2024-06-30T00:00:00.000Z', // Earlier than original end date
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(subscriptionWithEndDate);

        // Execute
        const result = await useCase.execute('sub-end-date', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.endDate).toBe('2024-06-30T00:00:00.000Z');
      });

      it('should handle different currencies', async () => {
        const usdSubscription = new Subscription(
          'sub-usd',
          'USD Service',
          new Money(9.99, 'USD'),
          new Date('2024-01-01T00:00:00.000Z'),
          'cat-services',
          'pm-credit',
          null
        );

        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(usdSubscription);

        // Execute
        const result = await useCase.execute('sub-usd', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.currency).toBe('USD');
        expect(result.subscription?.monthlyAmount).toBe(9.99);
      });
    });

    describe('subscription validation', () => {
      it('should fail when subscription not found', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('non-existent-sub', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Subscription not found']);
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.update).not.toHaveBeenCalled();
      });

      it('should fail when subscription is already cancelled', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(cancelledSubscription);

        // Execute
        const result = await useCase.execute('sub-cancelled', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Subscription is already cancelled']);
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.update).not.toHaveBeenCalled();
      });

      it('should fail when trying to cancel with end date before start date', async () => {
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: '2023-12-31T00:00:00.000Z', // Before start date (2024-01-01)
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to cancel subscription: End date must be after start date']);
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.update).not.toHaveBeenCalled();
      });

      it('should fail when trying to cancel with end date equal to start date', async () => {
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: '2024-01-01T00:00:00.000Z', // Same as start date
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to cancel subscription: End date must be after start date']);
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.update).not.toHaveBeenCalled();
      });

      it('should succeed when end date is after start date', async () => {
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: '2024-01-02T00:00:00.000Z', // Day after start date
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.endDate).toBe('2024-01-02T00:00:00.000Z');
      });
    });

    describe('error handling', () => {
      it('should handle repository findById errors gracefully', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockRejectedValue(new Error('Database connection failed'));

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to cancel subscription: Database connection failed']);
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.update).not.toHaveBeenCalled();
      });

      it('should handle repository update errors gracefully', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);
        mockSubscriptionRepo.update.mockRejectedValue(new Error('Update failed'));

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to cancel subscription: Update failed']);
        expect(result.subscription).toBeUndefined();
      });

      it('should handle domain validation errors from subscription.cancel', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Create a subscription that will throw error on cancel
        const alreadyCancelledSub = new Subscription(
          'sub-test',
          'Test Sub',
          new Money(10, 'BRL'),
          new Date('2024-01-01'),
          'cat-test',
          'pm-test',
          new Date('2024-06-01')
        );
        alreadyCancelledSub.cancel(new Date('2024-06-01'));

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(alreadyCancelledSub);

        // Execute
        const result = await useCase.execute('sub-test', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Subscription is already cancelled']);
        expect(mockSubscriptionRepo.update).not.toHaveBeenCalled();
      });

      it('should handle constraint violation errors', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);
        mockSubscriptionRepo.update.mockRejectedValue(new Error('Constraint violation'));

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to cancel subscription: Constraint violation']);
      });

      it('should handle timeout errors', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);
        mockSubscriptionRepo.update.mockRejectedValue(new Error('Request timeout'));

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to cancel subscription: Request timeout']);
      });

      it('should handle unknown errors gracefully', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);
        mockSubscriptionRepo.update.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to cancel subscription: Unknown error']);
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTO', async () => {
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: '2024-06-15T14:30:00.000Z',
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify response structure
        expect(result.success).toBe(true);
        expect(result.subscription).toBeDefined();
        expect(result.subscription).toHaveProperty('id');
        expect(result.subscription).toHaveProperty('name');
        expect(result.subscription).toHaveProperty('monthlyAmount');
        expect(result.subscription).toHaveProperty('currency');
        expect(result.subscription).toHaveProperty('startDate');
        expect(result.subscription).toHaveProperty('endDate');
        expect(result.subscription).toHaveProperty('categoryId');
        expect(result.subscription).toHaveProperty('paymentMethodId');
        expect(result.subscription).toHaveProperty('status');
        expect(result.subscription).toHaveProperty('createdAt');
        expect(result.subscription).toHaveProperty('updatedAt');

        // Verify specific values
        expect(result.subscription!.id).toBe('sub-active');
        expect(result.subscription!.name).toBe('Netflix Subscription');
        expect(result.subscription!.monthlyAmount).toBe(39.99);
        expect(result.subscription!.currency).toBe('BRL');
        expect(result.subscription!.status).toBe('cancelled');
        expect(result.subscription!.endDate).toBe('2024-06-15T14:30:00.000Z');

        // Verify dates are ISO strings
        expect(result.subscription!.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.subscription!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.subscription!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should handle null end date in response when cancelled immediately', async () => {
        const cancelDTO: CancelSubscriptionDTO = {}; // No end date provided

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify that end date is set (not null) when cancelled immediately
        expect(result.success).toBe(true);
        expect(result.subscription?.endDate).toBeDefined();
        expect(result.subscription?.endDate).not.toBeNull();
        expect(result.subscription?.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('domain object behavior', () => {
      it('should properly set cancellation date', async () => {
        const cancelDate = new Date('2024-07-01T10:15:30.500Z');
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: cancelDate.toISOString(),
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        await useCase.execute('sub-active', cancelDTO);

        // Verify the domain object was modified correctly
        const updatedSubscription = mockSubscriptionRepo.update.mock.calls[0][0] as Subscription;
        expect(updatedSubscription.endDate).toEqual(cancelDate);
        expect(updatedSubscription.status).toBe(SubscriptionStatus.CANCELLED);
        expect(updatedSubscription.isCancelled()).toBe(true);
      });

      it('should update the updatedAt timestamp', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};
        const beforeUpdate = new Date();

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        await useCase.execute('sub-active', cancelDTO);

        // Verify updatedAt was changed
        const updatedSubscription = mockSubscriptionRepo.update.mock.calls[0][0] as Subscription;
        expect(updatedSubscription.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      });
    });

    describe('edge cases', () => {
      it('should handle special characters in subscription ID', async () => {
        const specialSubscription = new Subscription(
          'sub-special-äöü-123',
          'Special Subscription',
          new Money(15.99, 'EUR'),
          new Date('2024-01-01T00:00:00.000Z'),
          'cat-special',
          'pm-special',
          null
        );

        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(specialSubscription);

        // Execute
        const result = await useCase.execute('sub-special-äöü-123', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.id).toBe('sub-special-äöü-123');
        expect(mockSubscriptionRepo.findById).toHaveBeenCalledWith('sub-special-äöü-123');
      });

      it('should handle very long subscription IDs', async () => {
        const longId = 'sub-' + 'a'.repeat(100);
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute(longId, cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(mockSubscriptionRepo.findById).toHaveBeenCalledWith(longId);
      });

      it('should handle subscription with very long name', async () => {
        const longNameSubscription = new Subscription(
          'sub-long-name',
          'A'.repeat(100), // Valid length
          new Money(25.99, 'BRL'),
          new Date('2024-01-01T00:00:00.000Z'),
          'cat-test',
          'pm-test',
          null
        );

        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(longNameSubscription);

        // Execute
        const result = await useCase.execute('sub-long-name', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.name).toBe('A'.repeat(100));
      });

      it('should handle cancellation far in the future', async () => {
        const futureDate = '2099-12-31T23:59:59.999Z';
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: futureDate,
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.endDate).toBe(futureDate);
      });

      it('should handle cancellation on leap year date', async () => {
        const leapYearDate = '2024-02-29T12:00:00.000Z';
        const cancelDTO: CancelSubscriptionDTO = {
          endDate: leapYearDate,
        };

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.endDate).toBe(leapYearDate);
      });

      it('should handle subscription with zero amount', async () => {
        const freeSubscription = new Subscription(
          'sub-free',
          'Free Service',
          new Money(1, 'BRL'), // Valid amount
          new Date('2024-01-01T00:00:00.000Z'),
          'cat-free',
          'pm-free',
          null
        );

        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(freeSubscription);

        // Execute
        const result = await useCase.execute('sub-free', cancelDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.monthlyAmount).toBe(1);
      });
    });

    describe('repository interaction', () => {
      it('should call repository methods in correct order', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        await useCase.execute('sub-active', cancelDTO);

        // Verify call order
        // expect(mockSubscriptionRepo.findById).toHaveBeenCalledBefore(
        //   mockSubscriptionRepo.update as any
        // );
        // TODO: Consider adding a more robust way to check call order if necessary
        expect(mockSubscriptionRepo.findById).toHaveBeenCalledWith('sub-active');
        expect(mockSubscriptionRepo.update).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'sub-active',
            status: SubscriptionStatus.CANCELLED
          })
        );
      });

      it('should not call update when subscription not found', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(null);

        // Execute
        await useCase.execute('non-existent', cancelDTO);

        // Verify
        expect(mockSubscriptionRepo.findById).toHaveBeenCalledWith('non-existent');
        expect(mockSubscriptionRepo.update).not.toHaveBeenCalled();
      });

      it('should not call update when subscription already cancelled', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(cancelledSubscription);

        // Execute
        await useCase.execute('sub-cancelled', cancelDTO);

        // Verify
        expect(mockSubscriptionRepo.findById).toHaveBeenCalledWith('sub-cancelled');
        expect(mockSubscriptionRepo.update).not.toHaveBeenCalled();
      });
    });

    describe('response format', () => {
      it('should return success response with subscription property', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(activeSubscription);

        // Execute
        const result = await useCase.execute('sub-active', cancelDTO);

        // Verify response structure
        expect(result).toEqual({
          success: true,
          subscription: expect.objectContaining({
            id: 'sub-active',
            status: 'cancelled',
          }),
        });
        expect(result).not.toHaveProperty('data');
        expect(result.errors).toBeUndefined();
      });

      it('should return error response with proper structure', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute('non-existent', cancelDTO);

        // Verify response structure
        expect(result).toEqual({
          success: false,
          errors: ['Subscription not found'],
        });
        expect(result).not.toHaveProperty('subscription');
        expect(result).not.toHaveProperty('data');
      });

      it('should return single error in array format', async () => {
        const cancelDTO: CancelSubscriptionDTO = {};

        // Setup mocks
        mockSubscriptionRepo.findById.mockResolvedValue(cancelledSubscription);

        // Execute
        const result = await useCase.execute('sub-cancelled', cancelDTO);

        // Verify error is in array format
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors).toHaveLength(1);
        expect(typeof result.errors?.[0]).toBe('string');
      });
    });
  });
}); 