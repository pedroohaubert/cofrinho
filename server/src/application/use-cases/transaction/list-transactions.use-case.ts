import { ITransactionRepository, TransactionFilters } from '../../../domain/repositories/transaction-repository.js';
import { ListTransactionsDTO, PaginatedTransactionsResponseDTO, TransactionDTOMapper } from '../../dto/transaction.dto.js';
import { DateRange } from '../../../domain/value-objects/date-range.js';

export interface ListTransactionsUseCaseResult {
  success: boolean;
  data?: PaginatedTransactionsResponseDTO;
  errors?: string[];
}

export class ListTransactionsUseCase {
  constructor(
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async execute(dto: ListTransactionsDTO): Promise<ListTransactionsUseCaseResult> {
    try {
      // Build filters from DTO
      const filters = this.buildFilters(dto);

      // Get paginated results
      const result = await this.transactionRepo.findPaginated(
        dto.page || 1,
        dto.limit || 20,
        filters
      );

      // Map domain entities to DTOs
      const response: PaginatedTransactionsResponseDTO = {
        items: result.items.map(transaction => 
          TransactionDTOMapper.toResponseDTO(transaction)
        ),
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious,
      };

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to list transactions: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private buildFilters(dto: ListTransactionsDTO): TransactionFilters {
    const filters: TransactionFilters = {};

    if (dto.categoryId) {
      filters.categoryId = dto.categoryId;
    }

    if (dto.paymentMethodId) {
      filters.paymentMethodId = dto.paymentMethodId;
    }

    if (dto.startDate) {
      filters.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      filters.endDate = new Date(dto.endDate);
    }

    if (dto.type) {
      filters.type = dto.type;
    }

    if (dto.source) {
      filters.source = dto.source;
    }

    if (dto.description) {
      filters.description = dto.description;
    }

    if (dto.minAmount !== undefined) {
      filters.minAmount = dto.minAmount;
    }

    if (dto.maxAmount !== undefined) {
      filters.maxAmount = dto.maxAmount;
    }

    return filters;
  }
} 