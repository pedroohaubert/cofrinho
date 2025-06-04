import { PaymentMethodType } from '@/domain/entities/payment-method.js';

// Request DTOs
export interface CreatePaymentMethodDTO {
  name: string;
  type: 'cash' | 'bank' | 'credit_card';
}

export interface UpdatePaymentMethodDTO {
  name?: string;
}

// Response DTOs
export interface PaymentMethodResponseDTO {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card';
  isActive: boolean;
  supportsInstallments: boolean;
  createdAt: string;
  updatedAt: string;
}

// Utility mapper
export class PaymentMethodDTOMapper {
  static toResponseDTO(paymentMethod: any): PaymentMethodResponseDTO {
    return {
      id: paymentMethod.id,
      name: paymentMethod.name,
      type: paymentMethod.type,
      isActive: paymentMethod.isActive,
      supportsInstallments: paymentMethod.supportsInstallments(),
      createdAt: paymentMethod.createdAt.toISOString(),
      updatedAt: paymentMethod.updatedAt.toISOString(),
    };
  }

  static toDomainType(type: string): PaymentMethodType {
    switch (type) {
      case 'cash':
        return PaymentMethodType.CASH;
      case 'bank':
        return PaymentMethodType.BANK;
      case 'credit_card':
        return PaymentMethodType.CREDIT_CARD;
      default:
        return PaymentMethodType.CASH;
    }
  }
} 