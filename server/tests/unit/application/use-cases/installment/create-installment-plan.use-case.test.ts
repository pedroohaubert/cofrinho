import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateInstallmentPlanUseCase } from '@/application/use-cases/installment/create-installment-plan.use-case.js';
import { IInstallmentPlanRepository } from '@/domain/repositories/installment-plan-repository.js';
import { ICategoryRepository } from '@/domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '@/domain/repositories/payment-method-repository.js';
import { InstallmentService } from '@/domain/services/installment-service.js';
import { InstallmentPlan } from '@/domain/entities/installment-plan.js';
import { Category } from '@/domain/entities/category.js';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { Money } from '@/domain/value-objects/money.js';
import { CreateInstallmentPlanDTO } from '@/application/dto/installment-plan.dto.js';

describe('CreateInstallmentPlanUseCase', () => {
  let useCase: CreateInstallmentPlanUseCase;
  let mockInstallmentPlanRepo: vi.Mocked<IInstallmentPlanRepository>;
  let mockCategoryRepo: vi.Mocked<ICategoryRepository>;
  let mockPaymentMethodRepo: vi.Mocked<IPaymentMethodRepository>;
  let mockInstallmentService: vi.Mocked<InstallmentService>;

  // Test entities
  const validExpenseCategory = new Category('cat-electronics', 'Electronics', TransactionType.EXPENSE);
  const validIncomeCategory = new Category('cat-income', 'Salary', TransactionType.INCOME);
  const inactiveCategory = Category.create('cat-inactive', 'Inactive Category', TransactionType.EXPENSE);
  
  const validCreditCard = new PaymentMethod('pm-credit', 'Credit Card', PaymentMethodType.CREDIT_CARD);
  const validBankAccount = new PaymentMethod('pm-bank', 'Bank Account', PaymentMethodType.BANK);
  const cashPaymentMethod = new PaymentMethod('pm-cash', 'Cash', PaymentMethodType.CASH);
  const inactivePaymentMethod = PaymentMethod.createCreditCard('pm-inactive', 'Inactive Card');

  beforeEach(() => {
    // Deactivate inactive entities
    inactiveCategory.deactivate();
    inactivePaymentMethod.deactivate();

    // Setup mock repositories
    mockInstallmentPlanRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findByStatus: vi.fn(),
      findActiveInstallmentPlans: vi.fn(),
      findByPaymentMethod: vi.fn(),
      findByCategory: vi.fn(),
      findByDateRange: vi.fn(),
      findPendingInstallmentsForMonth: vi.fn(),
      exists: vi.fn(),
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

    mockInstallmentService = {
      validateInstallmentPlan: vi.fn(),
      generateInstallmentTransactions: vi.fn(),
      getInstallmentProgress: vi.fn(),
      markInstallmentAsCompleted: vi.fn(),
      cancelInstallmentPlan: vi.fn(),
    } as any;

    useCase = new CreateInstallmentPlanUseCase(
      mockInstallmentPlanRepo,
      mockCategoryRepo,
      mockPaymentMethodRepo,
      mockInstallmentService
    );
  });

  describe('execute', () => {
    const validInstallmentPlanDTO: CreateInstallmentPlanDTO = {
      totalAmount: 1200,
      currency: 'BRL',
      purchaseDate: '2024-01-15T10:30:00.000Z',
      installmentCount: 12,
      description: 'New Laptop Purchase',
      paymentMethodId: 'pm-credit',
      categoryId: 'cat-electronics',
    };

    describe('successful installment plan creation', () => {
      it('should create installment plan successfully with all required data', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan).toBeDefined();
        expect(result.installmentPlan?.totalAmount).toBe(1200);
        expect(result.installmentPlan?.currency).toBe('BRL');
        expect(result.installmentPlan?.purchaseDate).toBe('2024-01-15T10:30:00.000Z');
        expect(result.installmentPlan?.installmentCount).toBe(12);
        expect(result.installmentPlan?.monthlyAmount).toBe(100); // 1200 / 12
        expect(result.installmentPlan?.description).toBe('New Laptop Purchase');
        expect(result.installmentPlan?.categoryId).toBe('cat-electronics');
        expect(result.installmentPlan?.paymentMethodId).toBe('pm-credit');
        expect(result.installmentPlan?.status).toBe('active');
        expect(result.errors).toBeUndefined();

        // Verify repository save was called
        expect(mockInstallmentPlanRepo.save).toHaveBeenCalledOnce();
        const savedPlan = mockInstallmentPlanRepo.save.mock.calls[0][0] as InstallmentPlan;
        expect(savedPlan.totalAmount.amount).toBe(1200);
        expect(savedPlan.totalAmount.currency).toBe('BRL');
        expect(savedPlan.installmentCount).toBe(12);
        expect(savedPlan.description).toBe('New Laptop Purchase');

        // Verify transaction generation was called
        expect(mockInstallmentService.generateInstallmentTransactions).toHaveBeenCalledOnce();
      });

      it('should create installment plan with different currency', async () => {
        const usdInstallmentPlan: CreateInstallmentPlanDTO = {
          ...validInstallmentPlanDTO,
          totalAmount: 800,
          currency: 'USD',
          description: 'USD Purchase',
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(usdInstallmentPlan);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan?.currency).toBe('USD');
        expect(result.installmentPlan?.totalAmount).toBe(800);
        expect(result.installmentPlan?.monthlyAmount).toBeCloseTo(66.67, 2); // 800 / 12
      });

      it('should create installment plan with different installment counts', async () => {
        const sixMonthPlan: CreateInstallmentPlanDTO = {
          ...validInstallmentPlanDTO,
          installmentCount: 6,
          description: '6-month installment plan',
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(sixMonthPlan);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan?.installmentCount).toBe(6);
        expect(result.installmentPlan?.monthlyAmount).toBe(200); // 1200 / 6
      });

      it('should generate unique installment plan IDs', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute multiple times
        await useCase.execute({ ...validInstallmentPlanDTO, description: 'First Plan' });
        await useCase.execute({ ...validInstallmentPlanDTO, description: 'Second Plan' });

        // Verify different IDs were generated
        expect(mockInstallmentPlanRepo.save).toHaveBeenCalledTimes(2);
        const firstPlan = mockInstallmentPlanRepo.save.mock.calls[0][0] as InstallmentPlan;
        const secondPlan = mockInstallmentPlanRepo.save.mock.calls[1][0] as InstallmentPlan;
        
        expect(firstPlan.id).not.toBe(secondPlan.id);
        expect(firstPlan.id).toMatch(/^ip-\d+-\w+$/);
        expect(secondPlan.id).toMatch(/^ip-\d+-\w+$/);
      });

      it('should use default currency when not provided', async () => {
        const planWithoutCurrency: CreateInstallmentPlanDTO = {
          totalAmount: 600,
          purchaseDate: '2024-01-15T10:30:00.000Z',
          installmentCount: 6,
          description: 'No currency specified',
          paymentMethodId: 'pm-credit',
          categoryId: 'cat-electronics',
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(planWithoutCurrency);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan?.currency).toBe('BRL'); // Default currency
      });
    });

    describe('category validation', () => {
      it('should fail when category not found', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(null);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category not found');
        expect(result.installmentPlan).toBeUndefined();
        expect(mockInstallmentPlanRepo.save).not.toHaveBeenCalled();
        expect(mockInstallmentService.generateInstallmentTransactions).not.toHaveBeenCalled();
      });

      it('should fail when category is inactive', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category is not active');
        expect(result.installmentPlan).toBeUndefined();
        expect(mockInstallmentPlanRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when category is not for expenses', async () => {
        // Setup mocks - using income category for installment (should fail)
        mockCategoryRepo.findById.mockResolvedValue(validIncomeCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Category cannot be used for expense transactions');
        expect(result.installmentPlan).toBeUndefined();
        expect(mockInstallmentPlanRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('payment method validation', () => {
      it('should fail when payment method not found', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method not found');
        expect(result.installmentPlan).toBeUndefined();
        expect(mockInstallmentPlanRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when payment method is inactive', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(inactivePaymentMethod);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method is not active');
        expect(result.installmentPlan).toBeUndefined();
        expect(mockInstallmentPlanRepo.save).not.toHaveBeenCalled();
      });

      it('should fail when payment method does not support installments', async () => {
        // Setup mocks - cash payment method doesn't support installments
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(cashPaymentMethod);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Payment method does not support installments');
        expect(result.installmentPlan).toBeUndefined();
        expect(mockInstallmentPlanRepo.save).not.toHaveBeenCalled();
      });
    });

    describe('combined validation errors', () => {
      it('should return all validation errors when multiple entities are invalid', async () => {
        // Setup mocks - both category and payment method not found
        mockCategoryRepo.findById.mockResolvedValue(null);
        mockPaymentMethodRepo.findById.mockResolvedValue(null);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Category not found');
        expect(result.errors).toContain('Payment method not found');
        expect(result.installmentPlan).toBeUndefined();
        expect(mockInstallmentPlanRepo.save).not.toHaveBeenCalled();
      });

      it('should return all validation errors when entities exist but are invalid', async () => {
        // Setup mocks - both inactive and wrong type
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(inactivePaymentMethod);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Category is not active');
        expect(result.errors).toContain('Payment method is not active');
      });
    });

    describe('installment service validation', () => {
      it('should fail when installment service validation fails', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: false,
          errors: ['Payment method validation failed', 'Installment limit exceeded'],
        });

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Payment method validation failed', 'Installment limit exceeded']);
        expect(result.installmentPlan).toBeUndefined();
        expect(mockInstallmentPlanRepo.save).not.toHaveBeenCalled();
        expect(mockInstallmentService.generateInstallmentTransactions).not.toHaveBeenCalled();
      });

      it('should succeed when installment service validation passes', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan).toBeDefined();
        expect(mockInstallmentService.validateInstallmentPlan).toHaveBeenCalledOnce();
      });
    });

    describe('transaction generation', () => {
      it('should clean up installment plan when transaction generation fails', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockRejectedValue(
          new Error('Failed to generate transactions')
        );

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create installment plan: Failed to generate installment transactions: Failed to generate transactions']);
        expect(result.installmentPlan).toBeUndefined();

        // Verify plan was saved then deleted due to transaction generation failure
        expect(mockInstallmentPlanRepo.save).toHaveBeenCalledOnce();
        expect(mockInstallmentPlanRepo.delete).toHaveBeenCalledOnce();

        const savedPlan = mockInstallmentPlanRepo.save.mock.calls[0][0] as InstallmentPlan;
        const deletedPlanId = mockInstallmentPlanRepo.delete.mock.calls[0][0];
        expect(deletedPlanId).toBe(savedPlan.id);
      });

      it('should succeed when transaction generation succeeds', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan).toBeDefined();
        expect(mockInstallmentPlanRepo.save).toHaveBeenCalledOnce();
        expect(mockInstallmentPlanRepo.delete).not.toHaveBeenCalled();
        expect(mockInstallmentService.generateInstallmentTransactions).toHaveBeenCalledOnce();
      });
    });

    describe('error handling', () => {
      it('should handle repository save errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentPlanRepo.save.mockRejectedValue(new Error('Database save failed'));

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create installment plan: Database save failed']);
        expect(result.installmentPlan).toBeUndefined();
      });

      it('should handle category repository errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockRejectedValue(new Error('Category database error'));
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create installment plan: Category database error']);
        expect(result.installmentPlan).toBeUndefined();
      });

      it('should handle payment method repository errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockRejectedValue(new Error('Payment method database error'));

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create installment plan: Payment method database error']);
        expect(result.installmentPlan).toBeUndefined();
      });

      it('should handle installment service validation errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockRejectedValue(new Error('Service validation error'));

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create installment plan: Service validation error']);
        expect(result.installmentPlan).toBeUndefined();
      });

      it('should handle unknown errors gracefully', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentPlanRepo.save.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to create installment plan: Unknown error']);
        expect(result.installmentPlan).toBeUndefined();
      });
    });

    describe('domain object creation', () => {
      it('should create correct domain objects with proper transformations', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        await useCase.execute(validInstallmentPlanDTO);

        // Verify the installment plan was created with correct domain objects
        expect(mockInstallmentPlanRepo.save).toHaveBeenCalledOnce();
        const savedPlan = mockInstallmentPlanRepo.save.mock.calls[0][0] as InstallmentPlan;
        
        expect(savedPlan.totalAmount).toBeInstanceOf(Money);
        expect(savedPlan.totalAmount.amount).toBe(1200);
        expect(savedPlan.totalAmount.currency).toBe('BRL');
        expect(savedPlan.purchaseDate).toBeInstanceOf(Date);
        expect(savedPlan.installmentCount).toBe(12);
        expect(savedPlan.description).toBe('New Laptop Purchase');
        expect(savedPlan.isActive()).toBe(true);
      });

      it('should properly calculate monthly amount', async () => {
        const oddDivisionPlan: CreateInstallmentPlanDTO = {
          ...validInstallmentPlanDTO,
          totalAmount: 1000,
          installmentCount: 3, // 1000 / 3 = 333.33...
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        await useCase.execute(oddDivisionPlan);

        // Verify monthly amount calculation
        const savedPlan = mockInstallmentPlanRepo.save.mock.calls[0][0] as InstallmentPlan;
        expect(savedPlan.monthlyAmount.amount).toBeCloseTo(333.33, 2);
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTO', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify response structure
        expect(result.success).toBe(true);
        expect(result.installmentPlan).toBeDefined();
        expect(result.installmentPlan).toHaveProperty('id');
        expect(result.installmentPlan).toHaveProperty('totalAmount');
        expect(result.installmentPlan).toHaveProperty('currency');
        expect(result.installmentPlan).toHaveProperty('purchaseDate');
        expect(result.installmentPlan).toHaveProperty('installmentCount');
        expect(result.installmentPlan).toHaveProperty('monthlyAmount');
        expect(result.installmentPlan).toHaveProperty('description');
        expect(result.installmentPlan).toHaveProperty('paymentMethodId');
        expect(result.installmentPlan).toHaveProperty('categoryId');
        expect(result.installmentPlan).toHaveProperty('status');
        expect(result.installmentPlan).toHaveProperty('createdAt');
        expect(result.installmentPlan).toHaveProperty('updatedAt');

        // Verify specific values
        expect(result.installmentPlan!.totalAmount).toBe(1200);
        expect(result.installmentPlan!.currency).toBe('BRL');
        expect(result.installmentPlan!.installmentCount).toBe(12);
        expect(result.installmentPlan!.monthlyAmount).toBe(100);
        expect(result.installmentPlan!.description).toBe('New Laptop Purchase');
        expect(result.installmentPlan!.status).toBe('active');

        // Verify dates are ISO strings
        expect(result.installmentPlan!.purchaseDate).toBe('2024-01-15T10:30:00.000Z');
        expect(result.installmentPlan!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.installmentPlan!.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('edge cases', () => {
      it('should handle very small amounts', async () => {
        const smallAmountPlan: CreateInstallmentPlanDTO = {
          ...validInstallmentPlanDTO,
          totalAmount: 2.40,
          installmentCount: 2, // 1.20 per installment
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(smallAmountPlan);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan?.totalAmount).toBe(2.40);
        expect(result.installmentPlan?.monthlyAmount).toBe(1.20);
      });

      it('should handle very large amounts', async () => {
        const largeAmountPlan: CreateInstallmentPlanDTO = {
          ...validInstallmentPlanDTO,
          totalAmount: 100000,
          installmentCount: 60, // Maximum installments
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(largeAmountPlan);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan?.totalAmount).toBe(100000);
        expect(result.installmentPlan?.installmentCount).toBe(60);
        expect(result.installmentPlan?.monthlyAmount).toBeCloseTo(1666.67, 2);
      });

      it('should handle very long descriptions', async () => {
        const longDescription = 'A'.repeat(500);
        const longDescriptionPlan: CreateInstallmentPlanDTO = {
          ...validInstallmentPlanDTO,
          description: longDescription,
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(longDescriptionPlan);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Failed to create installment plan: Description cannot exceed 200 characters');
      });

      it('should handle minimum installment count', async () => {
        const minInstallmentPlan: CreateInstallmentPlanDTO = {
          ...validInstallmentPlanDTO,
          installmentCount: 2, // Minimum allowed
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(minInstallmentPlan);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan?.installmentCount).toBe(2);
        expect(result.installmentPlan?.monthlyAmount).toBe(600); // 1200 / 2
      });

      it('should handle purchase date edge cases', async () => {
        const leapYearPlan: CreateInstallmentPlanDTO = {
          ...validInstallmentPlanDTO,
          purchaseDate: '2024-02-29T12:00:00.000Z', // Leap year date
        };

        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(leapYearPlan);

        // Verify
        expect(result.success).toBe(true);
        expect(result.installmentPlan?.purchaseDate).toBe('2024-02-29T12:00:00.000Z');
      });
    });

    describe('response format', () => {
      it('should return success response with installmentPlan property', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(validExpenseCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);
        mockInstallmentService.validateInstallmentPlan.mockResolvedValue({
          isValid: true,
          errors: [],
        });
        mockInstallmentService.generateInstallmentTransactions.mockResolvedValue([]);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify response structure
        expect(result).toEqual({
          success: true,
          installmentPlan: expect.objectContaining({
            id: expect.any(String),
            totalAmount: 1200,
            currency: 'BRL',
            installmentCount: 12,
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
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify response structure
        expect(result).toEqual({
          success: false,
          errors: ['Category not found'],
        });
        expect(result).not.toHaveProperty('installmentPlan');
        expect(result).not.toHaveProperty('data');
      });

      it('should return errors in array format', async () => {
        // Setup mocks
        mockCategoryRepo.findById.mockResolvedValue(inactiveCategory);
        mockPaymentMethodRepo.findById.mockResolvedValue(validCreditCard);

        // Execute
        const result = await useCase.execute(validInstallmentPlanDTO);

        // Verify error is in array format
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors).toHaveLength(1);
        expect(typeof result.errors?.[0]).toBe('string');
      });
    });
  });
}); 