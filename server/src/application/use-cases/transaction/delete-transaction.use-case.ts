import { ITransactionRepository } from '@/domain/repositories/transaction-repository.js';

export interface DeleteTransactionUseCaseResult {
  success: boolean;
  errors?: string[];
}

export class DeleteTransactionUseCase {
  constructor(
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async execute(id: string): Promise<DeleteTransactionUseCaseResult> {
    try {
      // Check if transaction exists
      const transaction = await this.transactionRepo.findById(id);
      if (!transaction) {
        return {
          success: false,
          errors: ['Transaction not found'],
        };
      }

      // Check if transaction can be deleted (only manual transactions)
      if (!transaction.isManual()) {
        return {
          success: false,
          errors: [
            'Only manual transactions can be deleted. ' +
            'To remove installment or subscription transactions, cancel the plan or subscription instead.'
          ],
        };
      }

      // Delete the transaction
      await this.transactionRepo.delete(id);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
} 