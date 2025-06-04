import { Money } from '../../domain/value-objects/money.js';
import { SubscriptionStatus } from '../../domain/entities/subscription.js';

// Request DTOs
export interface CreateSubscriptionDTO {
  name: string;
  monthlyAmount: number;
  currency?: string;
  startDate: string;
  categoryId: string;
  paymentMethodId: string;
  endDate?: string;
}

export interface UpdateSubscriptionDTO {
  name?: string;
}

export interface CancelSubscriptionDTO {
  endDate?: string;
}

// Response DTOs
export interface SubscriptionResponseDTO {
  id: string;
  name: string;
  monthlyAmount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  categoryId: string;
  paymentMethodId: string;
  status: 'active' | 'cancelled' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionOverviewResponseDTO {
  subscriptionId: string;
  name: string;
  monthlyAmount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'paused';
  startDate: string;
  endDate: string | null;
  monthsActive: number;
  totalPaid: number;
  nextPaymentDate: string | null;
  isActive: boolean;
  paymentCount: number;
}

export interface UpcomingPaymentResponseDTO {
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysUntilDue: number;
}

// Utility mapper
export class SubscriptionDTOMapper {
  static toResponseDTO(subscription: any): SubscriptionResponseDTO {
    return {
      id: subscription.id,
      name: subscription.name,
      monthlyAmount: subscription.monthlyAmount.amount,
      currency: subscription.monthlyAmount.currency,
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate?.toISOString() || null,
      categoryId: subscription.categoryId,
      paymentMethodId: subscription.paymentMethodId,
      status: subscription.status,
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }

  static toDomainMoney(amount: number, currency: string = 'BRL'): Money {
    return new Money(amount, currency);
  }

  static toOverviewResponseDTO(overview: any): SubscriptionOverviewResponseDTO {
    return {
      subscriptionId: overview.subscriptionId,
      name: overview.name,
      monthlyAmount: overview.monthlyAmount.amount,
      currency: overview.monthlyAmount.currency,
      status: overview.status,
      startDate: overview.startDate.toISOString(),
      endDate: overview.endDate?.toISOString() || null,
      monthsActive: overview.monthsActive,
      totalPaid: overview.totalPaid.amount,
      nextPaymentDate: overview.nextPaymentDate?.toISOString() || null,
      isActive: overview.isActive,
      paymentCount: overview.paymentCount,
    };
  }

  static toUpcomingPaymentResponseDTO(payment: any): UpcomingPaymentResponseDTO {
    return {
      subscriptionId: payment.subscriptionId,
      subscriptionName: payment.subscriptionName,
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      dueDate: payment.dueDate.toISOString(),
      daysUntilDue: payment.daysUntilDue,
    };
  }
} 