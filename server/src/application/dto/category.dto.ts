import { TransactionType } from '../../domain/value-objects/transaction-type.js';

// Request DTOs
export interface CreateCategoryDTO {
  name: string;
  type: 'income' | 'expense' | 'both';
  color?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  color?: string;
}

// Response DTOs
export interface CategoryResponseDTO {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Utility mapper
export class CategoryDTOMapper {
  static toResponseDTO(category: any): CategoryResponseDTO {
    return {
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  static toDomainType(type: string): TransactionType {
    switch (type) {
      case 'income':
        return TransactionType.INCOME;
      case 'expense':
        return TransactionType.EXPENSE;
      default:
        return TransactionType.EXPENSE; // Default to expense for 'both' type
    }
  }
} 