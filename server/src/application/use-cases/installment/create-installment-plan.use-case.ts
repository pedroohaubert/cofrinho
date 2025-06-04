import { InstallmentPlan } from '../../../domain/entities/installment-plan.js';
import { IInstallmentPlanRepository } from '../../../domain/repositories/installment-plan-repository.js';
import { ICategoryRepository } from '../../../domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '../../../domain/repositories/payment-method-repository.js';
import { InstallmentService } from '../../../domain/services/installment-service.js';
import { CreateInstallmentPlanDTO, InstallmentPlanResponseDTO, InstallmentPlanDTOMapper } from '../../dto/installment-plan.dto.js';
import { TransactionType } from '../../../domain/value-objects/transaction-type.js';

export interface CreateInstallmentPlanUseCaseResult {
  success: boolean;
  installmentPlan?: InstallmentPlanResponseDTO;
  errors?: string[];
}

export class CreateInstallmentPlanUseCase {
  constructor(
    private readonly installmentPlanRepo: IInstallmentPlanRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository,
    private readonly installmentService: InstallmentService
  ) {}

  async execute(dto: CreateInstallmentPlanDTO): Promise<CreateInstallmentPlanUseCaseResult> {
    try {
      // Validate related entities
      const validationErrors = await this.validateRelatedEntities(dto);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
        };
      }

      // Create domain objects
      const totalAmount = InstallmentPlanDTOMapper.toDomainMoney(dto.totalAmount, dto.currency);
      const purchaseDate = new Date(dto.purchaseDate);
      
      // Generate unique ID
      const id = this.generateId();

      // Create installment plan entity
      const installmentPlan = InstallmentPlan.create(
        id,
        totalAmount,
        purchaseDate,
        dto.installmentCount,
        dto.description,
        dto.paymentMethodId,
        dto.categoryId
      );

      // Validate installment plan
      const validationResult = await this.installmentService.validateInstallmentPlan(installmentPlan);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
        };
      }

      // Save installment plan
      await this.installmentPlanRepo.save(installmentPlan);

      // Generate installment transactions
      try {
        await this.installmentService.generateInstallmentTransactions(installmentPlan.id);
      } catch (error) {
        // If transaction generation fails, we should clean up the installment plan
        await this.installmentPlanRepo.delete(installmentPlan.id);
        throw new Error(`Failed to generate installment transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return {
        success: true,
        installmentPlan: InstallmentPlanDTOMapper.toResponseDTO(installmentPlan),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create installment plan: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private async validateRelatedEntities(dto: CreateInstallmentPlanDTO): Promise<string[]> {
    const errors: string[] = [];

    // Validate category exists, is active, and supports expenses
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) {
      errors.push('Category not found');
    } else if (!category.isActive) {
      errors.push('Category is not active');
    } else if (!category.canBeUsedForTransactionType(TransactionType.EXPENSE)) {
      errors.push('Category cannot be used for expense transactions');
    }

    // Validate payment method exists, is active, and supports installments
    const paymentMethod = await this.paymentMethodRepo.findById(dto.paymentMethodId);
    if (!paymentMethod) {
      errors.push('Payment method not found');
    } else if (!paymentMethod.isActive) {
      errors.push('Payment method is not active');
    } else if (!paymentMethod.supportsInstallments()) {
      errors.push('Payment method does not support installments');
    }

    return errors;
  }

  private generateId(): string {
    // In a real application, use a proper UUID generator
    return `ip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 