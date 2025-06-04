import { Subscription, SubscriptionStatus } from '@/domain/entities/subscription.js';

export interface ISubscriptionRepository {
  save(subscription: Subscription): Promise<void>;
  findById(id: string): Promise<Subscription | null>;
  findAll(): Promise<Subscription[]>;
  update(subscription: Subscription): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByStatus(status: SubscriptionStatus): Promise<Subscription[]>;
  findActiveSubscriptions(): Promise<Subscription[]>;
  findByPaymentMethod(paymentMethodId: string): Promise<Subscription[]>;
  findByCategory(categoryId: string): Promise<Subscription[]>;
  findActiveForMonth(year: number, month: number): Promise<Subscription[]>;
  findByName(name: string): Promise<Subscription | null>;
  
  // Validation support
  exists(id: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
} 