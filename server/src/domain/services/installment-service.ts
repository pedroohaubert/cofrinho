import { InstallmentPlan } from '../entities/installment-plan.js';
import { Transaction, TransactionSource } from '../entities/transaction.js';
import { TransactionType } from '../value-objects/transaction-type.js';
import { IInstallmentPlanRepository } from '../repositories/installment-plan-repository.js';
import { ITransactionRepository } from '../repositories/transaction-repository.js';
import { IPaymentMethodRepository } from '../repositories/payment-method-repository.js';

export class InstallmentService {
  constructor(
    private readonly installmentRepo: IInstallmentPlanRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository
  ) {}

  async validateInstallmentPlan(plan: InstallmentPlan): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate payment method supports installments
    const paymentMethod = await this.paymentMethodRepo.findById(plan.paymentMethodId);
    if (!paymentMethod) {
      errors.push('Payment method not found');
    } else if (!paymentMethod.supportsInstallments()) {
      errors.push('Payment method does not support installments');
    } else if (!paymentMethod.isActive) {
      errors.push('Payment method is inactive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async generateInstallmentTransactions(planId: string): Promise<Transaction[]> {
    const plan = await this.installmentRepo.findById(planId);
    if (!plan) {
      throw new Error('Installment plan not found');
    }

    if (!plan.isActive()) {
      throw new Error('Cannot generate transactions for inactive installment plan');
    }

    const installmentDates = plan.calculateInstallmentDates();
    const transactions: Transaction[] = [];

    for (let i = 0; i < installmentDates.length; i++) {
      const transactionId = `${planId}-installment-${i + 1}`;
      
      // Check if transaction already exists
      const existingTransaction = await this.transactionRepo.findById(transactionId);
      if (existingTransaction) {
        continue; // Skip if already generated
      }

      const transaction = Transaction.createFromInstallment(
        transactionId,
        installmentDates[i],
        plan.monthlyAmount,
        plan.categoryId,
        plan.paymentMethodId,
        TransactionType.EXPENSE,
        planId,
        `${plan.description} - Installment ${i + 1}/${plan.installmentCount}`
      );

      transactions.push(transaction);
    }

    return transactions;
  }

  async generatePendingInstallmentsForMonth(year: number, month: number): Promise<Transaction[]> {
    const pendingPlans = await this.installmentRepo.findPendingInstallmentsForMonth(year, month);
    const allTransactions: Transaction[] = [];

    for (const plan of pendingPlans) {
      const installmentDates = plan.calculateInstallmentDates();
      
      // Find installments for this specific month
      const monthlyInstallments = installmentDates.filter(date => 
        date.getFullYear() === year && date.getMonth() === month - 1
      );

      for (const installmentDate of monthlyInstallments) {
        const installmentIndex = installmentDates.findIndex(d => 
          d.getTime() === installmentDate.getTime()
        );
        
        const transactionId = `${plan.id}-installment-${installmentIndex + 1}`;
        
        // Check if transaction already exists
        const existingTransaction = await this.transactionRepo.findById(transactionId);
        if (existingTransaction) {
          continue;
        }

        const transaction = Transaction.createFromInstallment(
          transactionId,
          installmentDate,
          plan.monthlyAmount,
          plan.categoryId,
          plan.paymentMethodId,
          TransactionType.EXPENSE,
          plan.id,
          `${plan.description} - Installment ${installmentIndex + 1}/${plan.installmentCount}`
        );

        allTransactions.push(transaction);
      }
    }

    return allTransactions;
  }

  async getInstallmentProgress(planId: string): Promise<InstallmentProgress> {
    const plan = await this.installmentRepo.findById(planId);
    if (!plan) {
      throw new Error('Installment plan not found');
    }

    const transactions = await this.transactionRepo.findByInstallmentPlan(planId);
    const paidInstallments = transactions.length;
    const remainingInstallments = plan.installmentCount - paidInstallments;
    const remainingAmount = plan.getRemainingAmount(paidInstallments);

    return {
      planId: plan.id,
      description: plan.description,
      totalInstallments: plan.installmentCount,
      paidInstallments,
      remainingInstallments,
      totalAmount: plan.totalAmount,
      paidAmount: plan.monthlyAmount.multiply(paidInstallments),
      remainingAmount,
      progressPercentage: (paidInstallments / plan.installmentCount) * 100,
      isCompleted: paidInstallments >= plan.installmentCount,
      nextInstallmentDate: this.getNextInstallmentDate(plan, paidInstallments)
    };
  }

  async markInstallmentAsCompleted(planId: string): Promise<void> {
    const plan = await this.installmentRepo.findById(planId);
    if (!plan) {
      throw new Error('Installment plan not found');
    }

    const transactions = await this.transactionRepo.findByInstallmentPlan(planId);
    
    if (transactions.length >= plan.installmentCount) {
      plan.complete();
      await this.installmentRepo.update(plan);
    }
  }

  async cancelInstallmentPlan(planId: string): Promise<void> {
    const plan = await this.installmentRepo.findById(planId);
    if (!plan) {
      throw new Error('Installment plan not found');
    }

    plan.cancel();
    await this.installmentRepo.update(plan);
  }

  private getNextInstallmentDate(plan: InstallmentPlan, paidInstallments: number): Date | null {
    if (paidInstallments >= plan.installmentCount) {
      return null; // All installments paid
    }

    try {
      return plan.getInstallmentDateForIndex(paidInstallments);
    } catch {
      return null;
    }
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface InstallmentProgress {
  planId: string;
  description: string;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  totalAmount: any; // Money object
  paidAmount: any; // Money object
  remainingAmount: any; // Money object
  progressPercentage: number;
  isCompleted: boolean;
  nextInstallmentDate: Date | null;
} 