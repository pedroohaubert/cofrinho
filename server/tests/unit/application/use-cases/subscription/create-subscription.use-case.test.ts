import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateSubscriptionUseCase } from '@/application/use-cases/subscription/create-subscription.use-case.js';
import { ISubscriptionRepository } from '@/domain/repositories/subscription-repository.js';
import { ICategoryRepository } from '@/domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '@/domain/repositories/payment-method-repository.js';
import { Subscription } from '@/domain/entities/subscription.js';
import { Category } from '@/domain/entities/category.js';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { Money } from '@/domain/value-objects/money.js';
import { CreateSubscriptionDTO } from '@/application/dto/subscription.dto.js';

describe('CreateSubscriptionUseCase', () => {
  let useCase: CreateSubscriptionUseCase;
  let mockSubscriptionRepo: vi.Mocked<ISubscriptionRepository>;
  let mockCategoryRepo: vi.Mocked<ICategoryRepository>;
  let mockPaymentMethodRepo: vi.Mocked<IPaymentMethodRepository>;

  // Test entities
  const validExpenseCategory = new Category('cat-expense', 'Entertainment', TransactionType.EXPENSE);
  const validIncomeCategory = new Category('cat-income', 'Salary', TransactionType.INCOME);
  const inactiveCategory = Category.create('cat-inactive', 'Inactive Category', TransactionType.EXPENSE);
  
  const validCreditCard = new PaymentMethod('pm-credit', 'Credit Card', PaymentMethodType.CREDIT_CARD);
  const validBankAccount = new PaymentMethod('pm-bank', 'Bank Account', PaymentMethodType.BANK_ACCOUNT);
  const inactivePaymentMethod = PaymentMethod.createCreditCard('pm-inactive', 'Inactive Card');

  beforeEach(() => {
    // Deactivate inactive entities
    inactiveCategory.deactivate();
    inactivePaymentMethod.deactivate();

    // Setup mock repositories
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

    mockCategoryRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByType: vi.fn(),
      findActiveCategories: vi.fn(),
      findInactiveCategories: vi.fn(),
      findByName: vi.fn(),
      exists: vi.fn(),
      existsByName: vi.fn(),
    };

    mockPaymentMethodRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByType: vi.fn(),
      findActivePaymentMethods: vi.fn(),
      findInactivePaymentMethods: vi.fn(),
      findByName: vi.fn(),
      findSupportingInstallments: vi.fn(),
      exists: vi.fn(),
      existsByName: vi.fn(),
    };

    useCase = new CreateSubscriptionUseCase(
      mockSubscriptionRepo,
      mockCategoryRepo,
      mockPaymentMethodRepo
    );
  });

  describe('execute', () => {
    const validSubscriptionDTO: CreateSubscriptionDTO = {
      name: 'Netflix Subscription',
      monthlyAmount: 39.99,
      currency: 'BRL',
      startDate: '2024-01-01T00:00:00.000Z',
      categoryId: 'cat-expense',
      paymentMethodId: 'pm-credit',
    };

    describe('successful subscription creation', () => {
      it('should create subscription successfully with all required data', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription).toBeDefined();
        expect(result.subscription?.name).toBe('Netflix Subscription');
        expect(result.subscription?.monthlyAmount).toBe(39.99);
        expect(result.subscription?.currency).toBe('BRL');
        expect(result.subscription?.startDate).toBe('2024-01-01T00:00:00.000Z');
        expect(result.subscription?.categoryId).toBe('cat-expense');
        expect(result.subscription?.paymentMethodId).toBe('pm-credit');
        expect(result.subscription?.endDate).toBeNull();
        expect(result.subscription?.status).toBe('active');
        expect(result.errors).toBeUndefined();

        // Verify repository save was called
        expect(mockSubscriptionRepo.save).toHaveBeenCalledOnce();
        const savedSubscription = mockSubscriptionRepo.save.mock.calls[0][0] as Subscription;
        expect(savedSubscription.name).toBe('Netflix Subscription');
        expect(savedSubscription.monthlyAmount.amount).toBe(39.99);
        expect(savedSubscription.monthlyAmount.currency).toBe('BRL');
      });

      it('should create subscription with end date', async () => {
        const subscriptionWithEndDate: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          endDate: '2024-12-31T23:59:59.999Z',
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(subscriptionWithEndDate);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.endDate).toBe('2024-12-31T23:59:59.999Z');
      });

      it('should create subscription with different currency', async () => {
        const usdSubscription: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          name: 'Spotify USD',
          monthlyAmount: 9.99,
          currency: 'USD',
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(usdSubscription);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.currency).toBe('USD');
        expect(result.subscription?.monthlyAmount).toBe(9.99);
      });

      it('should create subscription with bank account payment method', async () => {
        const bankAccountSubscription: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          name: 'Internet Bill',
          paymentMethodId: 'pm-bank',
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validBankAccount);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(bankAccountSubscription);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.paymentMethodId).toBe('pm-bank');
      });

      it('should generate unique subscription IDs', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute multiple times
        await useCase.execute({ ...validSubscriptionDTO, name: 'First Sub' });
        await useCase.execute({ ...validSubscriptionDTO, name: 'Second Sub' });

        // Verify different IDs were generated
        expect(mockSubscriptionRepo.save).toHaveBeenCalledTimes(2);
        const firstSubscription = mockSubscriptionRepo.save.mock.calls[0][0] as Subscription;
        const secondSubscription = mockSubscriptionRepo.save.mock.calls[1][0] as Subscription;
        
        expect(firstSubscription.id).not.toBe(secondSubscription.id);
        expect(firstSubscription.id).toMatch(/^sub-\d+-\w+$/);
        expect(secondSubscription.id).toMatch(/^sub-\d+-\w+$/);
      });
    });

    describe('category validation', () => {
      it('should fail when category not found', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(null);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category not found');
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when category is inactive', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category is not active');
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when category is not for expenses', async () => {
        // Setup mocks - using income category for subscription (should fail)
        mockCategoryRepo.findById.mockResolvedValue(validIncomeCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category cannot be used for expense transactions');
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('payment method validation', () => {
      it('should fail when payment method not found', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method not found');
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when payment method is inactive', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(inactivePaymentMethod);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method is not active');
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('combined validation errors', () => {
      it('should return all validation errors when multiple entities are invalid', async () => {
        // Setup mocks - both category and payment method not found
        mockCategoryRepo.findById.mockResolvedValue(null);
        mockPaymentMethodRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Category not found');
        expect(result.errors).toContain('Payment method not found');
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
      });

      it('should return all validation errors when entities exist but are invalid', async () => {
        // Setup mocks - both inactive and wrong type category
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(inactivePaymentMethod);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Category is not active');
        expect(result.errors).toContain('Payment method is not active');
      });
    });

    describe('date validation', () => {
      it('should fail when end date is before start date', async () => {
        const invalidDateSubscription: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          startDate: '2024-06-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z', // End before start
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(invalidDateSubscription);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('End date must be after start date');
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when end date equals start date', async () => {
        const sameDate = '2024-01-01T00:00:00.000Z';
        const invalidDateSubscription: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          startDate: sameDate,
          endDate: sameDate,
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(invalidDateSubscription);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('End date must be after start date');
      });

      it('should succeed when end date is after start date', async () => {
        const validDateSubscription: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-12-31T23:59:59.999Z',
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validDateSubscription);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.startDate).toBe('2024-01-01T00:00:00.000Z');
        expect(result.subscription?.endDate).toBe('2024-12-31T23:59:59.999Z');
      });
    });

    describe('duplicate subscription validation', () => {
      it('should fail when active subscription with same name already exists', async () => {
        const existingSubscription = new Subscription(
          'existing-sub',
          'Netflix Subscription',
          new Money(39.99, 'BRL'),
          new Date('2024-01-01'),
          'cat-expense',
          'pm-credit',
          null
        );

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(existingSubscription);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('A subscription with this name already exists');
        expect(result.subscription).toBeUndefined();
        expect(mockSubscriptionRepo.save).not.toHaveBeenCalled();
      });

      it('should succeed when subscription with same name exists but is cancelled', async () => {
        const cancelledSubscription = new Subscription(
          'cancelled-sub',
          'Netflix Subscription',
          new Money(39.99, 'BRL'),
          new Date('2024-01-01'),
          'cat-expense',
          'pm-credit',
          new Date('2024-06-01') // Has end date, so cancelled
        );
        cancelledSubscription.cancel(new Date('2024-06-01'));

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(cancelledSubscription);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify - should succeed since existing subscription is cancelled
        expect(result.success).toBe(true);
        expect(result.subscription?.name).toBe('Netflix Subscription');
        expect(mockSubscriptionRepo.save).toHaveBeenCalled();
      });

      it('should succeed when no subscription with same name exists', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.name).toBe('Netflix Subscription');
        expect(mockSubscriptionRepo.save).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle repository save errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);
        mockSubscriptionRepo.save.mockRejectedValue(new Error('Database save failed'));

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create subscription: Database save failed']);
        expect(result.subscription).toBeUndefined();
      });

      it('should handle category repository errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockRejectedValue(new Error('Category database error'));
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create subscription: Category database error']);
        expect(result.subscription).toBeUndefined();
      });

      it('should handle payment method repository errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockRejectedValue(new Error('Payment method database error'));

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create subscription: Payment method database error']);
        expect(result.subscription).toBeUndefined();
      });

      it('should handle subscription repository findByName errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockRejectedValue(new Error('Database query error'));

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create subscription: Database query error']);
        expect(result.subscription).toBeUndefined();
      });

      it('should handle unknown errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);
        mockSubscriptionRepo.save.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create subscription: Unknown error']);
        expect(result.subscription).toBeUndefined();
      });
    });

    describe('domain object creation', () => {
      it('should create correct domain objects with proper transformations', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        await useCase.execute(validSubscriptionDTO);

        // Verify the subscription was created with correct domain objects
        expect(mockSubscriptionRepo.save).toHaveBeenCalledOnce();
        const savedSubscription = mockSubscriptionRepo.save.mock.calls[0][0] as Subscription;
        
        expect(savedSubscription.monthlyAmount).toBeInstanceOf(Money);
        expect(savedSubscription.monthlyAmount.amount).toBe(39.99);
        expect(savedSubscription.monthlyAmount.currency).toBe('BRL');
        expect(savedSubscription.startDate).toBeInstanceOf(Date);
        expect(savedSubscription.isActive()).toBe(true);
        expect(savedSubscription.endDate).toBeNull();
      });

      it('should handle end date domain object creation', async () => {
        const subscriptionWithEndDate: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          endDate: '2024-12-31T23:59:59.999Z',
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        await useCase.execute(subscriptionWithEndDate);

        // Verify the subscription was created with end date
        const savedSubscription = mockSubscriptionRepo.save.mock.calls[0][0] as Subscription;
        expect(savedSubscription.endDate).toBeInstanceOf(Date);
        expect(savedSubscription.endDate?.toISOString()).toBe('2024-12-31T23:59:59.999Z');
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTO', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

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

        // Verify dates are ISO strings
        expect(result.subscription!.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.subscription!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.subscription!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('edge cases', () => {
      it('should handle very small amounts', async () => {
        const smallAmountSubscription: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          monthlyAmount: 0.01,
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(smallAmountSubscription);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.monthlyAmount).toBe(0.01);
      });

      it('should handle very large amounts', async () => {
        const largeAmountSubscription: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          monthlyAmount: 999999.99,
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(largeAmountSubscription);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.monthlyAmount).toBe(999999.99);
      });

      it('should handle very long subscription names', async () => {
        const longName = 'A'.repeat(100);
        const longNameSubscription: CreateSubscriptionDTO = {
          ...validSubscriptionDTO,
          name: longName,
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(longNameSubscription);

        // Verify
        expect(result.success).toBe(true);
        expect(result.subscription?.name).toBe(longName);
      });
    });

    describe('response format', () => {
      it('should return success response with subscription property', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockSubscriptionRepo.findByName.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify response structure
        expect(result).toEqual({
          success: true,
          subscription: expect.objectContaining({
            id: expect.any(String),
            name: 'Netflix Subscription',
            monthlyAmount: 39.99,
            currency: 'BRL',
          }),
        });
        expect(result).not.toHaveProperty('data');
        expect(result.errors).toBeUndefined();
      });

      it('should return error response with proper structure', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(null);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify response structure
        expect(result).toEqual({
          success: false,
          errors: ['Category not found'],
        });
        expect(result).not.toHaveProperty('subscription');
        expect(result).not.toHaveProperty('data');
      });

      it('should return errors in array format', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validSubscriptionDTO);

        // Verify error is in array format
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors).toHaveLength(1);
        expect(typeof result.errors?.[0]).toBe('string');
      });
    });
  });
}); 