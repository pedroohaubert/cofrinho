import { Subscription } from '@/domain/entities/subscription.js';
import { Transaction } from '@/domain/entities/transaction.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { ISubscriptionRepository } from '@/domain/repositories/subscription-repository.js';
import { ITransactionRepository } from '@/domain/repositories/transaction-repository.js';

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly transactionRepo: ITransactionRepository
  ) {}

  async generateSubscriptionTransactionsForMonth(year: number, month: number): Promise<Transaction[]> {
    const activeSubscriptions = await this.subscriptionRepo.findActiveForMonth(year, month);
    const transactions: Transaction[] = [];

    for (const subscription of activeSubscriptions) {
      if (!subscription.shouldGeneratePaymentForMonth(year, month)) {
        continue;
      }

      const transactionId = `${subscription.id}-${year}-${month.toString().padStart(2, '0')}`;
      
      // Check if transaction already exists for this month
      const existingTransaction = await this.transactionRepo.findById(transactionId);
      if (existingTransaction) {
        continue;
      }

      // Create transaction for this month's payment
      const paymentDate = new Date(year, month - 1, subscription.startDate.getDate());
      
      const transaction = Transaction.createFromSubscription(
        transactionId,
        paymentDate,
        subscription.monthlyAmount,
        subscription.categoryId,
        subscription.paymentMethodId,
        TransactionType.EXPENSE,
        subscription.id,
        `${subscription.name} - Monthly payment`
      );

      transactions.push(transaction);
    }

    return transactions;
  }

  async getSubscriptionOverview(subscriptionId: string): Promise<SubscriptionOverview> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const transactions = await this.transactionRepo.findBySubscription(subscriptionId);
    const totalPaid = transactions.reduce((sum, t) => sum.add(t.amount), subscription.monthlyAmount.multiply(0));
    
    const monthsActive = this.calculateMonthsActive(subscription);
    const nextPaymentDate = subscription.getNextPaymentDate();

    return {
      subscriptionId: subscription.id,
      name: subscription.name,
      monthlyAmount: subscription.monthlyAmount,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      monthsActive,
      totalPaid,
      nextPaymentDate,
      isActive: subscription.isActive(),
      paymentCount: transactions.length
    };
  }

  async getActiveSubscriptionsTotal(): Promise<SubscriptionTotal> {
    const activeSubscriptions = await this.subscriptionRepo.findActiveSubscriptions();
    
    let totalMonthlyAmount = activeSubscriptions[0]?.monthlyAmount.multiply(0) || null;
    
    for (const subscription of activeSubscriptions) {
      if (totalMonthlyAmount) {
        totalMonthlyAmount = totalMonthlyAmount.add(subscription.monthlyAmount);
      } else {
        totalMonthlyAmount = subscription.monthlyAmount;
      }
    }

    return {
      count: activeSubscriptions.length,
      totalMonthlyAmount: totalMonthlyAmount,
      subscriptions: activeSubscriptions.map(s => ({
        id: s.id,
        name: s.name,
        monthlyAmount: s.monthlyAmount
      }))
    };
  }

  async cancelSubscription(subscriptionId: string, endDate?: Date): Promise<void> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.cancel(endDate);
    await this.subscriptionRepo.update(subscription);
  }

  async pauseSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.pause();
    await this.subscriptionRepo.update(subscription);
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.resume();
    await this.subscriptionRepo.update(subscription);
  }

  async getUpcomingPayments(daysAhead: number = 30): Promise<UpcomingPayment[]> {
    const activeSubscriptions = await this.subscriptionRepo.findActiveSubscriptions();
    const upcomingPayments: UpcomingPayment[] = [];
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    for (const subscription of activeSubscriptions) {
      const nextPaymentDate = subscription.getNextPaymentDate(now);
      
      if (nextPaymentDate && nextPaymentDate <= futureDate) {
        upcomingPayments.push({
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          amount: subscription.monthlyAmount,
          dueDate: nextPaymentDate,
          daysUntilDue: Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    }

    return upcomingPayments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  private calculateMonthsActive(subscription: Subscription): number {
    const now = new Date();
    const endDate = subscription.endDate || now;
    const startDate = subscription.startDate;

    const monthsActive = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth()) + 1;

    return Math.max(0, monthsActive);
  }
}

export interface SubscriptionOverview {
  subscriptionId: string;
  name: string;
  monthlyAmount: any; // Money object
  status: string;
  startDate: Date;
  endDate: Date | null;
  monthsActive: number;
  totalPaid: any; // Money object
  nextPaymentDate: Date | null;
  isActive: boolean;
  paymentCount: number;
}

export interface SubscriptionTotal {
  count: number;
  totalMonthlyAmount: any; // Money object or null
  subscriptions: Array<{
    id: string;
    name: string;
    monthlyAmount: any; // Money object
  }>;
}

export interface UpcomingPayment {
  subscriptionId: string;
  subscriptionName: string;
  amount: any; // Money object
  dueDate: Date;
  daysUntilDue: number;
} 