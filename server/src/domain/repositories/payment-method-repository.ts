import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method.js';

export interface IPaymentMethodRepository {
  save(paymentMethod: PaymentMethod): Promise<void>;
  findById(id: string): Promise<PaymentMethod | null>;
  findAll(): Promise<PaymentMethod[]>;
  update(paymentMethod: PaymentMethod): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByType(type: PaymentMethodType): Promise<PaymentMethod[]>;
  findActivePaymentMethods(): Promise<PaymentMethod[]>;
  findInactivePaymentMethods(): Promise<PaymentMethod[]>;
  findByName(name: string): Promise<PaymentMethod | null>;
  findSupportingInstallments(): Promise<PaymentMethod[]>;
  
  // Validation support
  exists(id: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
} 