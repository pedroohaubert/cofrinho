import { Subscription } from '../../../domain/entities/subscription.js';
import { ISubscriptionRepository } from '../../../domain/repositories/subscription-repository.js';
import { ICategoryRepository } from '../../../domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '../../../domain/repositories/payment-method-repository.js';
import { CreateSubscriptionDTO, SubscriptionResponseDTO, SubscriptionDTOMapper } from '../../dto/subscription.dto.js';
import { TransactionType } from '../../../domain/value-objects/transaction-type.js';

export interface CreateSubscriptionUseCaseResult {
  success: boolean;
  subscription?: SubscriptionResponseDTO;
  errors?: string[];
}

export class CreateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository
  ) {}

  async execute(dto: CreateSubscriptionDTO): Promise<CreateSubscriptionUseCaseResult> {
    try {
      // Validate related entities
      const validationErrors = await this.validateRelatedEntities(dto);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
        };
      }

      // Check for duplicate subscription name
      const existingSubscription = await this.subscriptionRepo.findByName(dto.name);
      if (existingSubscription && existingSubscription.isActive()) {
        return {
          success: false,
          errors: ['A subscription with this name already exists'],
        };
      }

      // Create domain objects
      const monthlyAmount = SubscriptionDTOMapper.toDomainMoney(dto.monthlyAmount, dto.currency);
      const startDate = new Date(dto.startDate);
      const endDate = dto.endDate ? new Date(dto.endDate) : null;
      
      // Generate unique ID
      const id = this.generateId();

      // Create subscription entity
      const subscription = new Subscription(
        id,
        dto.name,
        monthlyAmount,
        startDate,
        dto.categoryId,
        dto.paymentMethodId,
        endDate
      );

      // Save subscription
      await this.subscriptionRepo.save(subscription);

      return {
        success: true,
        subscription: SubscriptionDTOMapper.toResponseDTO(subscription),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private async validateRelatedEntities(dto: CreateSubscriptionDTO): Promise<string[]> {
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

    // Validate payment method exists and is active
    const paymentMethod = await this.paymentMethodRepo.findById(dto.paymentMethodId);
    if (!paymentMethod) {
      errors.push('Payment method not found');
    } else if (!paymentMethod.isActive) {
      errors.push('Payment method is not active');
    }

    // Validate dates
    if (dto.endDate) {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
    }

    return errors;
  }

  private generateId(): string {
    // In a real application, use a proper UUID generator
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 