import { Transaction } from '../../../domain/entities/transaction.js';
import { ITransactionRepository } from '../../../domain/repositories/transaction-repository.js';
import { ICategoryRepository } from '../../../domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '../../../domain/repositories/payment-method-repository.js';
import { TransactionService } from '../../../domain/services/transaction-service.js';
import { CreateTransactionDTO, TransactionResponseDTO, TransactionDTOMapper } from '../../dto/transaction.dto.js';
import { Money } from '../../../domain/value-objects/money.js';
import { TransactionType } from '../../../domain/value-objects/transaction-type.js';

export interface CreateTransactionUseCaseResult {
  success: boolean;
  transaction?: TransactionResponseDTO;
  errors?: string[];
}

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository,
    private readonly transactionService: TransactionService
  ) {}

  async execute(dto: CreateTransactionDTO): Promise<CreateTransactionUseCaseResult> {
    try {
      // Validate related entities exist
      const validationErrors = await this.validateRelatedEntities(dto);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
        };
      }

      // Create domain objects
      const amount = TransactionDTOMapper.toDomainMoney(dto.amount, dto.currency);
      const type = TransactionDTOMapper.toDomainType(dto.type);
      const date = new Date(dto.date);
      
      // Generate unique ID (in a real app, this would be a UUID generator)
      const id = this.generateId();

      // Create transaction entity
      const transaction = Transaction.createManual(
        id,
        date,
        amount,
        dto.categoryId,
        dto.paymentMethodId,
        type,
        dto.description
      );

      // Validate transaction using domain service
      const validationResult = await this.transactionService.validateTransaction(transaction);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
        };
      }

      // Check for potential duplicates
      const duplicates = await this.transactionService.detectDuplicateTransactions(transaction);
      if (duplicates.length > 0) {
        return {
          success: false,
          errors: ['Potential duplicate transaction detected. Please verify this transaction is unique.'],
        };
      }

      // Save transaction
      await this.transactionRepo.save(transaction);

      // Return success response
      return {
        success: true,
        transaction: TransactionDTOMapper.toResponseDTO(transaction),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private async validateRelatedEntities(dto: CreateTransactionDTO): Promise<string[]> {
    const errors: string[] = [];

    // Validate category exists and is active
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) {
      errors.push('Category not found');
    } else if (!category.isActive) {
      errors.push('Category is not active');
    } else if (!category.canBeUsedForTransactionType(TransactionDTOMapper.toDomainType(dto.type))) {
      errors.push(`Category cannot be used for ${dto.type} transactions`);
    }

    // Validate payment method exists and is active
    const paymentMethod = await this.paymentMethodRepo.findById(dto.paymentMethodId);
    if (!paymentMethod) {
      errors.push('Payment method not found');
    } else if (!paymentMethod.isActive) {
      errors.push('Payment method is not active');
    }

    return errors;
  }

  private generateId(): string {
    // In a real application, use a proper UUID generator
    return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
} 