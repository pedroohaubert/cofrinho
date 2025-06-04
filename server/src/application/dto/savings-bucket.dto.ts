import { Money } from '../../domain/value-objects/money.js';

// Request DTOs
export interface CreateSavingsBucketDTO {
  name: string;
  targetAmount?: number;
  currency?: string;
  description?: string;
  initialBalance?: number;
}

export interface UpdateSavingsBucketDTO {
  name?: string;
  targetAmount?: number;
  currency?: string;
  description?: string;
}

export interface TransferToBucketDTO {
  amount: number;
  currency?: string;
  description?: string;
  type: 'deposit' | 'withdrawal';
}

// Response DTOs
export interface SavingsBucketResponseDTO {
  id: string;
  name: string;
  targetAmount: number | null;
  currency: string;
  currentBalance: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  progressPercentage: number | null;
  remainingAmount: number | null;
  isTargetReached: boolean;
}

export interface BucketTransferResponseDTO {
  id: string;
  bucketId: string;
  amount: number;
  currency: string;
  type: 'deposit' | 'withdrawal';
  description: string | null;
  date: string;
  createdAt: string;
}

export interface BucketSummaryResponseDTO {
  bucketId: string;
  name: string;
  description: string | null;
  currentBalance: number;
  currency: string;
  targetAmount: number | null;
  progressPercentage: number | null;
  remainingAmount: number | null;
  isTargetReached: boolean;
  totalDeposits: number;
  totalWithdrawals: number;
  transferCount: number;
  isActive: boolean;
}

// Utility mapper
export class SavingsBucketDTOMapper {
  static toResponseDTO(bucket: any): SavingsBucketResponseDTO {
    return {
      id: bucket.id,
      name: bucket.name,
      targetAmount: bucket.targetAmount?.amount || null,
      currency: bucket.currentBalance.currency,
      currentBalance: bucket.currentBalance.amount,
      description: bucket.description,
      isActive: bucket.isActive,
      createdAt: bucket.createdAt.toISOString(),
      updatedAt: bucket.updatedAt.toISOString(),
      progressPercentage: bucket.getProgressPercentage(),
      remainingAmount: bucket.getRemainingAmount()?.amount || null,
      isTargetReached: bucket.isTargetReached(),
    };
  }

  static toTransferResponseDTO(transfer: any): BucketTransferResponseDTO {
    return {
      id: transfer.id,
      bucketId: transfer.bucketId,
      amount: transfer.amount.amount,
      currency: transfer.amount.currency,
      type: transfer.type,
      description: transfer.description,
      date: transfer.date.toISOString(),
      createdAt: transfer.createdAt.toISOString(),
    };
  }

  static toBucketSummaryResponseDTO(summary: any): BucketSummaryResponseDTO {
    return {
      bucketId: summary.bucketId,
      name: summary.name,
      description: summary.description,
      currentBalance: summary.currentBalance.amount,
      currency: summary.currentBalance.currency,
      targetAmount: summary.targetAmount?.amount || null,
      progressPercentage: summary.progressPercentage,
      remainingAmount: summary.remainingAmount?.amount || null,
      isTargetReached: summary.isTargetReached,
      totalDeposits: summary.totalDeposits.amount,
      totalWithdrawals: summary.totalWithdrawals.amount,
      transferCount: summary.transferCount,
      isActive: summary.isActive,
    };
  }

  static toDomainMoney(amount: number, currency: string = 'BRL'): Money {
    return new Money(amount, currency);
  }
} 