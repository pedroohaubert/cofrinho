import { Money } from '@/domain/value-objects/money.js';
import { DateRange } from '@/domain/value-objects/date-range.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { ITransactionRepository } from '@/domain/repositories/transaction-repository.js';
import { ICategoryRepository } from '@/domain/repositories/category-repository.js';
import { IPaymentMethodRepository } from '@/domain/repositories/payment-method-repository.js';
import { ISubscriptionRepository } from '@/domain/repositories/subscription-repository.js';
import { ISavingsBucketRepository } from '@/domain/repositories/savings-bucket-repository.js';

export class ReportingService {
  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository,
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly savingsBucketRepo: ISavingsBucketRepository
  ) {}

  async generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const dateRange = DateRange.monthlyRange(year, month);
    
    const [
      transactions,
      totalIncome,
      totalExpense,
      categories,
      paymentMethods
    ] = await Promise.all([
      this.transactionRepo.findByMonth(year, month),
      this.transactionRepo.getTotalIncomeForPeriod(dateRange),
      this.transactionRepo.getTotalExpenseForPeriod(dateRange),
      this.categoryRepo.findAll(),
      this.paymentMethodRepo.findAll()
    ]);

    const net = totalIncome - totalExpense;

    // Category breakdown
    const categoryBreakdown = await this.generateCategoryBreakdown(categories, dateRange);
    
    // Payment method breakdown
    const paymentMethodBreakdown = await this.generatePaymentMethodBreakdown(paymentMethods, dateRange);

    // Top categories
    const topExpenseCategories = categoryBreakdown
      .filter(c => c.type === TransactionType.EXPENSE)
      .sort((a, b) => b.totalAmount.amount - a.totalAmount.amount)
      .slice(0, 5);

    const topIncomeCategories = categoryBreakdown
      .filter(c => c.type === TransactionType.INCOME)
      .sort((a, b) => b.totalAmount.amount - a.totalAmount.amount)
      .slice(0, 5);

    return {
      period: dateRange,
      summary: {
        totalIncome: Money.fromCents(totalIncome),
        totalExpense: Money.fromCents(totalExpense),
        net: Money.fromCents(net),
        transactionCount: transactions.length,
        averageTransactionAmount: transactions.length > 0 
          ? Money.fromCents((totalIncome + totalExpense) / transactions.length)
          : Money.zero()
      },
      categoryBreakdown,
      paymentMethodBreakdown,
      topExpenseCategories,
      topIncomeCategories,
      dailyTrends: this.calculateDailyTrends(transactions, dateRange)
    };
  }

  async generateYearlyReport(year: number): Promise<YearlyReport> {
    const dateRange = DateRange.yearlyRange(year);
    
    const [
      monthlyTotals,
      totalIncome,
      totalExpense,
      categories,
      yearlyTransactions
    ] = await Promise.all([
      this.transactionRepo.getMonthlyTotals(year),
      this.transactionRepo.getTotalIncomeForPeriod(dateRange),
      this.transactionRepo.getTotalExpenseForPeriod(dateRange),
      this.categoryRepo.findAll(),
      this.transactionRepo.findByYear(year)
    ]);

    const net = totalIncome - totalExpense;
    const categoryBreakdown = await this.generateCategoryBreakdown(categories, dateRange);

    // Calculate monthly trends
    const monthlyBreakdown = monthlyTotals.map(m => ({
      month: m.month,
      year: m.year,
      totalIncome: Money.fromCents(m.totalIncome),
      totalExpense: Money.fromCents(m.totalExpense),
      net: Money.fromCents(m.net)
    }));

    // Calculate averages
    const avgMonthlyIncome = Money.fromCents(totalIncome / 12);
    const avgMonthlyExpense = Money.fromCents(totalExpense / 12);

    return {
      year,
      period: dateRange,
      summary: {
        totalIncome: Money.fromCents(totalIncome),
        totalExpense: Money.fromCents(totalExpense),
        net: Money.fromCents(net),
        avgMonthlyIncome,
        avgMonthlyExpense,
        transactionCount: yearlyTransactions.length,
        monthsWithData: monthlyTotals.length
      },
      monthlyBreakdown,
      categoryBreakdown,
      trends: this.calculateYearlyTrends(monthlyTotals)
    };
  }

  async generateCashFlowReport(dateRange: DateRange): Promise<CashFlowReport> {
    const transactions = await this.transactionRepo.findByDateRange(dateRange);
    const sortedTransactions = transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = Money.zero();
    const dailyBalances: DailyBalance[] = [];
    const cashFlowItems: CashFlowItem[] = [];

    // Group transactions by day
    const transactionsByDay = new Map<string, typeof transactions>();
    
    for (const transaction of sortedTransactions) {
      const dateKey = transaction.date.toISOString().split('T')[0];
      if (!transactionsByDay.has(dateKey)) {
        transactionsByDay.set(dateKey, []);
      }
      transactionsByDay.get(dateKey)!.push(transaction);
    }

    // Calculate daily cash flow
    for (const [dateStr, dayTransactions] of transactionsByDay) {
      let dailyIncome = Money.zero();
      let dailyExpense = Money.zero();

      for (const transaction of dayTransactions) {
        const item: CashFlowItem = {
          date: transaction.date,
          description: transaction.description || 'No description',
          amount: transaction.amount,
          type: transaction.type,
          category: 'Unknown', // Would need to fetch category name
          balance: runningBalance
        };

        if (transaction.isIncome()) {
          runningBalance = runningBalance.add(transaction.amount);
          dailyIncome = dailyIncome.add(transaction.amount);
        } else {
          runningBalance = runningBalance.subtract(transaction.amount);
          dailyExpense = dailyExpense.add(transaction.amount);
        }

        item.balance = runningBalance;
        cashFlowItems.push(item);
      }

      dailyBalances.push({
        date: new Date(dateStr),
        income: dailyIncome,
        expense: dailyExpense,
        net: dailyIncome.subtract(dailyExpense),
        balance: runningBalance
      });
    }

    return {
      period: dateRange,
      openingBalance: Money.zero(), // Would need to calculate from previous period
      closingBalance: runningBalance,
      totalInflow: cashFlowItems
        .filter(item => item.type === TransactionType.INCOME)
        .reduce((sum, item) => sum.add(item.amount), Money.zero()),
      totalOutflow: cashFlowItems
        .filter(item => item.type === TransactionType.EXPENSE)
        .reduce((sum, item) => sum.add(item.amount), Money.zero()),
      dailyBalances,
      cashFlowItems
    };
  }

  private async generateCategoryBreakdown(
    categories: any[], 
    dateRange: DateRange
  ): Promise<CategoryBreakdownItem[]> {
    const breakdown: CategoryBreakdownItem[] = [];

    for (const category of categories) {
      const total = await this.transactionRepo.getTotalByCategory(category.id, dateRange);
      
      if (total > 0) {
        breakdown.push({
          categoryId: category.id,
          categoryName: category.name,
          type: category.type,
          totalAmount: Money.fromCents(total),
          transactionCount: 0, // Would need additional query
          averageAmount: Money.zero(), // Would calculate from transaction count
          percentage: 0 // Would calculate against total expense/income
        });
      }
    }

    return breakdown;
  }

  private async generatePaymentMethodBreakdown(
    paymentMethods: any[], 
    dateRange: DateRange
  ): Promise<PaymentMethodBreakdownItem[]> {
    const breakdown: PaymentMethodBreakdownItem[] = [];

    for (const paymentMethod of paymentMethods) {
      const total = await this.transactionRepo.getTotalByPaymentMethod(paymentMethod.id, dateRange);
      
      if (total > 0) {
        breakdown.push({
          paymentMethodId: paymentMethod.id,
          paymentMethodName: paymentMethod.name,
          paymentMethodType: paymentMethod.type,
          totalAmount: Money.fromCents(total),
          transactionCount: 0, // Would need additional query
          percentage: 0 // Would calculate against total
        });
      }
    }

    return breakdown;
  }

  private calculateDailyTrends(transactions: any[], dateRange: DateRange): DailyTrend[] {
    // Implementation would group transactions by day and calculate trends
    return [];
  }

  private calculateYearlyTrends(monthlyTotals: any[]): YearlyTrends {
    // Implementation would analyze monthly data for trends
    return {
      incomeGrowth: 0,
      expenseGrowth: 0,
      bestMonth: { month: 1, net: Money.zero() },
      worstMonth: { month: 1, net: Money.zero() }
    };
  }
}

// Interfaces
export interface MonthlyReport {
  period: DateRange;
  summary: MonthlySummary;
  categoryBreakdown: CategoryBreakdownItem[];
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  topExpenseCategories: CategoryBreakdownItem[];
  topIncomeCategories: CategoryBreakdownItem[];
  dailyTrends: DailyTrend[];
}

export interface YearlyReport {
  year: number;
  period: DateRange;
  summary: YearlySummary;
  monthlyBreakdown: MonthlyBreakdownItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  trends: YearlyTrends;
}

export interface CashFlowReport {
  period: DateRange;
  openingBalance: Money;
  closingBalance: Money;
  totalInflow: Money;
  totalOutflow: Money;
  dailyBalances: DailyBalance[];
  cashFlowItems: CashFlowItem[];
}

export interface MonthlySummary {
  totalIncome: Money;
  totalExpense: Money;
  net: Money;
  transactionCount: number;
  averageTransactionAmount: Money;
}

export interface YearlySummary {
  totalIncome: Money;
  totalExpense: Money;
  net: Money;
  avgMonthlyIncome: Money;
  avgMonthlyExpense: Money;
  transactionCount: number;
  monthsWithData: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  totalAmount: Money;
  transactionCount: number;
  averageAmount: Money;
  percentage: number;
}

export interface PaymentMethodBreakdownItem {
  paymentMethodId: string;
  paymentMethodName: string;
  paymentMethodType: string;
  totalAmount: Money;
  transactionCount: number;
  percentage: number;
}

export interface MonthlyBreakdownItem {
  month: number;
  year: number;
  totalIncome: Money;
  totalExpense: Money;
  net: Money;
}

export interface DailyBalance {
  date: Date;
  income: Money;
  expense: Money;
  net: Money;
  balance: Money;
}

export interface CashFlowItem {
  date: Date;
  description: string;
  amount: Money;
  type: TransactionType;
  category: string;
  balance: Money;
}

export interface DailyTrend {
  date: Date;
  income: Money;
  expense: Money;
  net: Money;
}

export interface YearlyTrends {
  incomeGrowth: number;
  expenseGrowth: number;
  bestMonth: { month: number; net: Money };
  worstMonth: { month: number; net: Money };
} 