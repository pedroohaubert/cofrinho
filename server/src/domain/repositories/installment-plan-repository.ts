import { InstallmentPlan, InstallmentPlanStatus } from '@/domain/entities/installment-plan.js';

export interface IInstallmentPlanRepository {
  save(installmentPlan: InstallmentPlan): Promise<void>;
  findById(id: string): Promise<InstallmentPlan | null>;
  findAll(): Promise<InstallmentPlan[]>;
  update(installmentPlan: InstallmentPlan): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByStatus(status: InstallmentPlanStatus): Promise<InstallmentPlan[]>;
  findActiveInstallmentPlans(): Promise<InstallmentPlan[]>;
  findByPaymentMethod(paymentMethodId: string): Promise<InstallmentPlan[]>;
  findByCategory(categoryId: string): Promise<InstallmentPlan[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<InstallmentPlan[]>;
  findPendingInstallmentsForMonth(year: number, month: number): Promise<InstallmentPlan[]>;
  
  // Validation support
  exists(id: string): Promise<boolean>;
} 