import { Money } from '../../domain/value-objects/money.js';
import { InstallmentPlanStatus } from '../../domain/entities/installment-plan.js';

// Request DTOs
export interface CreateInstallmentPlanDTO {
  totalAmount: number;
  currency?: string;
  purchaseDate: string;
  installmentCount: number;
  description: string;
  paymentMethodId: string;
  categoryId: string;
}

export interface UpdateInstallmentPlanDTO {
  description?: string;
}

// Response DTOs
export interface InstallmentPlanResponseDTO {
  id: string;
  totalAmount: number;
  currency: string;
  purchaseDate: string;
  installmentCount: number;
  monthlyAmount: number;
  description: string;
  paymentMethodId: string;
  categoryId: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentProgressResponseDTO {
  planId: string;
  description: string;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  totalAmount: number;
  currency: string;
  paidAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  isCompleted: boolean;
  nextInstallmentDate: string | null;
}

// Utility mapper
export class InstallmentPlanDTOMapper {
  static toResponseDTO(plan: any): InstallmentPlanResponseDTO {
    return {
      id: plan.id,
      totalAmount: plan.totalAmount.amount,
      currency: plan.totalAmount.currency,
      purchaseDate: plan.purchaseDate.toISOString(),
      installmentCount: plan.installmentCount,
      monthlyAmount: plan.monthlyAmount.amount,
      description: plan.description,
      paymentMethodId: plan.paymentMethodId,
      categoryId: plan.categoryId,
      status: plan.status,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  static toDomainMoney(amount: number, currency: string = 'BRL'): Money {
    return new Money(amount, currency);
  }

  static toProgressResponseDTO(progress: any): InstallmentProgressResponseDTO {
    return {
      planId: progress.planId,
      description: progress.description,
      totalInstallments: progress.totalInstallments,
      paidInstallments: progress.paidInstallments,
      remainingInstallments: progress.remainingInstallments,
      totalAmount: progress.totalAmount.amount,
      currency: progress.totalAmount.currency,
      paidAmount: progress.paidAmount.amount,
      remainingAmount: progress.remainingAmount.amount,
      progressPercentage: progress.progressPercentage,
      isCompleted: progress.isCompleted,
      nextInstallmentDate: progress.nextInstallmentDate?.toISOString() || null,
    };
  }
} 