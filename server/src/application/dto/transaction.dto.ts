import { Money } from '../../domain/value-objects/money.js';
import { TransactionType } from '../../domain/value-objects/transaction-type.js';
import { TransactionSource } from '../../domain/entities/transaction.js';

// Request DTOs
export interface CreateTransactionDTO {
  date: string;
  amount: number;
  currency?: string;
  categoryId: string;
  paymentMethodId: string;
  type: 'income' | 'expense';
  description?: string;
}

export interface UpdateTransactionDTO {
  date?: string;
  amount?: number;
  currency?: string;
  categoryId?: string;
  paymentMethodId?: string;
  description?: string;
}

export interface ListTransactionsDTO {
  page?: number;
  limit?: number;
  categoryId?: string;
  paymentMethodId?: string;
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense';
  source?: 'manual' | 'installment' | 'subscription';
  description?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Response DTOs
export interface TransactionResponseDTO {
  id: string;
  date: string;
  amount: number;
  currency: string;
  categoryId: string;
  paymentMethodId: string;
  type: 'income' | 'expense';
  description: string | null;
  source: 'manual' | 'installment' | 'subscription';
  sourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTransactionsResponseDTO {
  items: TransactionResponseDTO[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Utility functions for converting between domain and DTOs
export class TransactionDTOMapper {
  static toResponseDTO(transaction: any): TransactionResponseDTO {
    return {
      id: transaction.id,
      date: transaction.date.toISOString(),
      amount: transaction.amount.amount,
      currency: transaction.amount.currency,
      categoryId: transaction.categoryId,
      paymentMethodId: transaction.paymentMethodId,
      type: transaction.type,
      description: transaction.description,
      source: transaction.source,
      sourceId: transaction.sourceId,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };
  }

  static toDomainMoney(amount: number, currency: string = 'BRL'): Money {
    return new Money(amount, currency);
  }

  static toDomainType(type: string): TransactionType {
    return type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;
  }

  static toDomainSource(source: string): TransactionSource {
    switch (source) {
      case 'installment':
        return TransactionSource.INSTALLMENT;
      case 'subscription':
        return TransactionSource.SUBSCRIPTION;
      default:
        return TransactionSource.MANUAL;
    }
  }
} 