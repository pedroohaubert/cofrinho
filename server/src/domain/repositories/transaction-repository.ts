import { Transaction } from '../entities/transaction.js';
import { DateRange } from '../value-objects/date-range.js';

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findAll(): Promise<Transaction[]>;
  update(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByDateRange(dateRange: DateRange): Promise<Transaction[]>;
  findByMonth(year: number, month: number): Promise<Transaction[]>;
  findByYear(year: number): Promise<Transaction[]>;
  findByCategory(categoryId: string): Promise<Transaction[]>;
  findByPaymentMethod(paymentMethodId: string): Promise<Transaction[]>;
  findBySource(sourceId: string): Promise<Transaction[]>;
  findByInstallmentPlan(installmentPlanId: string): Promise<Transaction[]>;
  findBySubscription(subscriptionId: string): Promise<Transaction[]>;
  
  // Pagination support
  findPaginated(
    page: number, 
    limit: number, 
    filters?: TransactionFilters
  ): Promise<PaginatedResult<Transaction>>;
  
  // Aggregation methods
  getTotalByCategory(categoryId: string, dateRange?: DateRange): Promise<number>;
  getTotalByPaymentMethod(paymentMethodId: string, dateRange?: DateRange): Promise<number>;
  getTotalIncomeForPeriod(dateRange: DateRange): Promise<number>;
  getTotalExpenseForPeriod(dateRange: DateRange): Promise<number>;
  getMonthlyTotals(year: number): Promise<MonthlyTotal[]>;
  
  // Validation support
  exists(id: string): Promise<boolean>;
}

export interface TransactionFilters {
  categoryId?: string;
  paymentMethodId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: 'income' | 'expense';
  source?: 'manual' | 'installment' | 'subscription';
  description?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface MonthlyTotal {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
} 