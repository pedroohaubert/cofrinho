import { Transaction } from '../entities/transaction.js';
import { Money } from '../value-objects/money.js';
import { DateRange } from '../value-objects/date-range.js';
import { ITransactionRepository } from '../repositories/transaction-repository.js';
import { ICategoryRepository } from '../repositories/category-repository.js';
import { IPaymentMethodRepository } from '../repositories/payment-method-repository.js';

export class TransactionService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository
  ) {}

  async validateTransaction(transaction: Transaction): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate category exists and is active
    const category = await this.categoryRepo.findById(transaction.categoryId);
    if (!category) {
      errors.push('Category not found');
    } else if (!category.isActive) {
      errors.push('Category is inactive');
    } else if (!category.canBeUsedForTransactionType(transaction.type)) {
      errors.push(`Category cannot be used for ${transaction.type} transactions`);
    }

    // Validate payment method exists and is active
    const paymentMethod = await this.paymentMethodRepo.findById(transaction.paymentMethodId);
    if (!paymentMethod) {
      errors.push('Payment method not found');
    } else if (!paymentMethod.isActive) {
      errors.push('Payment method is inactive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async calculateNetForPeriod(dateRange: DateRange): Promise<Money> {
    const totalIncome = await this.transactionRepo.getTotalIncomeForPeriod(dateRange);
    const totalExpense = await this.transactionRepo.getTotalExpenseForPeriod(dateRange);
    
    return Money.fromCents(totalIncome - totalExpense);
  }

  async getMonthlyBreakdown(year: number): Promise<MonthlyBreakdown[]> {
    const monthlyTotals = await this.transactionRepo.getMonthlyTotals(year);
    
    return monthlyTotals.map(total => ({
      month: total.month,
      year: total.year,
      totalIncome: Money.fromCents(total.totalIncome),
      totalExpense: Money.fromCents(total.totalExpense),
      net: Money.fromCents(total.net),
      percentage: this.calculatePercentageChange(total)
    }));
  }

  async getCategorySpending(
    categoryId: string, 
    dateRange?: DateRange
  ): Promise<CategorySpendingInfo> {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const total = await this.transactionRepo.getTotalByCategory(categoryId, dateRange);
    const transactions = dateRange 
      ? await this.transactionRepo.findByDateRange(dateRange)
      : await this.transactionRepo.findByCategory(categoryId);

    const categoryTransactions = transactions.filter(t => t.categoryId === categoryId);

    return {
      category: category.name,
      totalAmount: Money.fromCents(total),
      transactionCount: categoryTransactions.length,
      averageAmount: categoryTransactions.length > 0 
        ? Money.fromCents(total / categoryTransactions.length) 
        : Money.zero(),
      period: dateRange
    };
  }

  async getPaymentMethodUsage(
    paymentMethodId: string, 
    dateRange?: DateRange
  ): Promise<PaymentMethodUsageInfo> {
    const paymentMethod = await this.paymentMethodRepo.findById(paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    const total = await this.transactionRepo.getTotalByPaymentMethod(paymentMethodId, dateRange);
    const transactions = dateRange 
      ? await this.transactionRepo.findByDateRange(dateRange)
      : await this.transactionRepo.findByPaymentMethod(paymentMethodId);

    const paymentMethodTransactions = transactions.filter(t => t.paymentMethodId === paymentMethodId);

    return {
      paymentMethod: paymentMethod.name,
      totalAmount: Money.fromCents(total),
      transactionCount: paymentMethodTransactions.length,
      averageAmount: paymentMethodTransactions.length > 0 
        ? Money.fromCents(total / paymentMethodTransactions.length) 
        : Money.zero(),
      period: dateRange
    };
  }

  async detectDuplicateTransactions(transaction: Transaction): Promise<Transaction[]> {
    // Find transactions with same amount and date (within same day)
    const startOfDay = new Date(transaction.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(transaction.date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayTransactions = await this.transactionRepo.findByDateRange(
      new DateRange(startOfDay, endOfDay)
    );

    return dayTransactions.filter(t => 
      t.id !== transaction.id &&
      t.amount.equals(transaction.amount) &&
      t.categoryId === transaction.categoryId &&
      t.paymentMethodId === transaction.paymentMethodId
    );
  }

  async calculateRunningBalance(
    transactions: Transaction[], 
    startingBalance: Money = Money.zero()
  ): Promise<TransactionWithBalance[]> {
    let runningBalance = startingBalance;
    
    // Sort transactions by date
    const sortedTransactions = transactions.sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    return sortedTransactions.map(transaction => {
      if (transaction.isIncome()) {
        runningBalance = runningBalance.add(transaction.amount);
      } else {
        runningBalance = runningBalance.subtract(transaction.amount);
      }

      return {
        transaction,
        balance: runningBalance
      };
    });
  }

  private calculatePercentageChange(total: any): number {
    // This is a placeholder - in real implementation, you'd compare with previous month
    return 0;
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface MonthlyBreakdown {
  month: number;
  year: number;
  totalIncome: Money;
  totalExpense: Money;
  net: Money;
  percentage: number;
}

export interface CategorySpendingInfo {
  category: string;
  totalAmount: Money;
  transactionCount: number;
  averageAmount: Money;
  period?: DateRange;
}

export interface PaymentMethodUsageInfo {
  paymentMethod: string;
  totalAmount: Money;
  transactionCount: number;
  averageAmount: Money;
  period?: DateRange;
}

export interface TransactionWithBalance {
  transaction: Transaction;
  balance: Money;
} 