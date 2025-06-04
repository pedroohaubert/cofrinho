import { ITransactionRepository } from '../../../domain/repositories/transaction-repository.js';
import { ICategoryRepository } from '../../../domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '../../../domain/repositories/payment-method-repository.js';
import { TransactionService } from '../../../domain/services/transaction-service.js';
import { UpdateTransactionDTO, TransactionResponseDTO, TransactionDTOMapper } from '../../dto/transaction.dto.js';

export interface UpdateTransactionUseCaseResult {
  success: boolean;
  transaction?: TransactionResponseDTO;
  errors?: string[];
}

export class UpdateTransactionUseCase {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository,
    private readonly transactionService: TransactionService
  ) {}

  async execute(id: string, dto: UpdateTransactionDTO): Promise<UpdateTransactionUseCaseResult> {
    try {
      // Find existing transaction
      const transaction = await this.transactionRepo.findById(id);
      if (!transaction) {
        return {
          success: false,
          errors: ['Transaction not found'],
        };
      }

      // Check if transaction can be updated (only manual transactions)
      if (!transaction.isManual()) {
        return {
          success: false,
          errors: ['Only manual transactions can be updated. Installment and subscription transactions are read-only.'],
        };
      }

      // Validate related entities if they are being updated
      const validationErrors = await this.validateRelatedEntities(dto);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
        };
      }

      // Update transaction fields
      if (dto.date !== undefined) {
        transaction.updateDate(new Date(dto.date));
      }

      if (dto.amount !== undefined) {
        const amount = TransactionDTOMapper.toDomainMoney(dto.amount, dto.currency);
        transaction.updateAmount(amount);
      }

      if (dto.categoryId !== undefined) {
        transaction.updateCategory(dto.categoryId);
      }

      if (dto.paymentMethodId !== undefined) {
        transaction.updatePaymentMethod(dto.paymentMethodId);
      }

      if (dto.description !== undefined) {
        transaction.updateDescription(dto.description);
      }

      // Validate updated transaction
      const validationResult = await this.transactionService.validateTransaction(transaction);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
        };
      }

      // Save updated transaction
      await this.transactionRepo.update(transaction);

      return {
        success: true,
        transaction: TransactionDTOMapper.toResponseDTO(transaction),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to update transaction: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private async validateRelatedEntities(dto: UpdateTransactionDTO): Promise<string[]> {
    const errors: string[] = [];

    // Validate category if being updated
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findById(dto.categoryId);
      if (!category) {
        errors.push('Category not found');
      } else if (!category.isActive) {
        errors.push('Category is not active');
      }
    }

    // Validate payment method if being updated
    if (dto.paymentMethodId !== undefined) {
      const paymentMethod = await this.paymentMethodRepo.findById(dto.paymentMethodId);
      if (!paymentMethod) {
        errors.push('Payment method not found');
      } else if (!paymentMethod.isActive) {
        errors.push('Payment method is not active');
      }
    }

    return errors;
  }
} 