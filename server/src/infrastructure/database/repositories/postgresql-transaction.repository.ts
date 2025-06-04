import sql from '@/infrastructure/database/connection.js';
import { Transaction, TransactionSource } from '@/domain/entities/transaction.js';
import { ITransactionRepository, TransactionFilters, PaginatedResult, MonthlyTotal } from '@/domain/repositories/transaction-repository.js';
import { Money } from '@/domain/value-objects/money.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { DateRange } from '@/domain/value-objects/date-range.js';

interface TransactionRow {
  id: string;
  date: Date;
  amount: number;
  category_id: string;
  payment_method_id: string;
  description: string | null;
  type: 'income' | 'expense';
  source_type: 'manual' | 'installment' | 'subscription';
  source_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export class PostgreSQLTransactionRepository implements ITransactionRepository {
  
  async save(transaction: Transaction): Promise<void> {
    await sql`
      INSERT INTO transactions (
        id, date, amount, category_id, payment_method_id, 
        description, type, source_type, source_id, created_at, updated_at
      ) VALUES (
        ${transaction.id},
        ${transaction.date},
        ${this.getAmountForStorage(transaction)},
        ${transaction.categoryId},
        ${transaction.paymentMethodId},
        ${transaction.description},
        ${transaction.type.toString().toLowerCase()},
        ${transaction.source},
        ${transaction.sourceId},
        ${transaction.createdAt},
        ${transaction.updatedAt}
      )
    `;
  }

  async findById(id: string): Promise<Transaction | null> {
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions WHERE id = ${id}
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async findAll(): Promise<Transaction[]> {
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions ORDER BY date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async update(transaction: Transaction): Promise<void> {
    await sql`
      UPDATE transactions 
      SET 
        date = ${transaction.date},
        amount = ${this.getAmountForStorage(transaction)},
        category_id = ${transaction.categoryId},
        payment_method_id = ${transaction.paymentMethodId},
        description = ${transaction.description},
        updated_at = ${new Date()}
      WHERE id = ${transaction.id}
    `;
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM transactions WHERE id = ${id}`;
  }

  async findByDateRange(dateRange: DateRange): Promise<Transaction[]> {
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions 
      WHERE date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
      ORDER BY date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByMonth(year: number, month: number): Promise<Transaction[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions 
      WHERE date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByYear(year: number): Promise<Transaction[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions 
      WHERE date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions 
      WHERE category_id = ${categoryId}
      ORDER BY date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByPaymentMethod(paymentMethodId: string): Promise<Transaction[]> {
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions 
      WHERE payment_method_id = ${paymentMethodId}
      ORDER BY date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findBySource(sourceId: string): Promise<Transaction[]> {
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions 
      WHERE source_id = ${sourceId}
      ORDER BY date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByInstallmentPlan(installmentPlanId: string): Promise<Transaction[]> {
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions 
      WHERE source_type = 'installment' AND source_id = ${installmentPlanId}
      ORDER BY date ASC, created_at ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findBySubscription(subscriptionId: string): Promise<Transaction[]> {
    const result = await sql<TransactionRow[]>`
      SELECT * FROM transactions 
      WHERE source_type = 'subscription' AND source_id = ${subscriptionId}
      ORDER BY date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findPaginated(
    page: number, 
    limit: number, 
    filters?: TransactionFilters
  ): Promise<PaginatedResult<Transaction>> {
    const offset = (page - 1) * limit;
    
    // Build WHERE clause dynamically based on filters
    const whereConditions: string[] = [];
    const params: any[] = [];
    
    if (filters) {
      if (filters.categoryId) {
        whereConditions.push(`category_id = $${params.length + 1}`);
        params.push(filters.categoryId);
      }
      
      if (filters.paymentMethodId) {
        whereConditions.push(`payment_method_id = $${params.length + 1}`);
        params.push(filters.paymentMethodId);
      }
      
      if (filters.startDate) {
        whereConditions.push(`date >= $${params.length + 1}`);
        params.push(filters.startDate);
      }
      
      if (filters.endDate) {
        whereConditions.push(`date <= $${params.length + 1}`);
        params.push(filters.endDate);
      }
      
      if (filters.type) {
        whereConditions.push(`type = $${params.length + 1}`);
        params.push(filters.type);
      }
      
      if (filters.source) {
        whereConditions.push(`source_type = $${params.length + 1}`);
        params.push(filters.source);
      }
      
      if (filters.description) {
        whereConditions.push(`description ILIKE $${params.length + 1}`);
        params.push(`%${filters.description}%`);
      }
      
      if (filters.minAmount !== undefined) {
        whereConditions.push(`ABS(amount) >= $${params.length + 1}`);
        params.push(filters.minAmount);
      }
      
      if (filters.maxAmount !== undefined) {
        whereConditions.push(`ABS(amount) <= $${params.length + 1}`);
        params.push(filters.maxAmount);
      }
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM transactions ${whereClause}`;
    const countResult = await sql.unsafe(countQuery, params);
    const totalItems = parseInt(countResult[0].count);
    
    // Get paginated results
    const dataQuery = `
      SELECT * FROM transactions 
      ${whereClause}
      ORDER BY date DESC, created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);
    
    const result = await sql.unsafe(dataQuery, params) as TransactionRow[];
    const items = result.map(row => this.mapRowToEntity(row));
    
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      items,
      totalItems,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  async getTotalByCategory(categoryId: string, dateRange?: DateRange): Promise<number> {
    let query;
    let params: any[] = [categoryId];
    
    if (dateRange) {
      query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total 
        FROM transactions 
        WHERE category_id = $1 AND date BETWEEN $2 AND $3
      `;
      params.push(dateRange.startDate, dateRange.endDate);
    } else {
      query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total 
        FROM transactions 
        WHERE category_id = $1
      `;
    }
    
    const result = await sql.unsafe(query, params);
    return parseFloat(result[0].total || '0');
  }

  async getTotalByPaymentMethod(paymentMethodId: string, dateRange?: DateRange): Promise<number> {
    let query;
    let params: any[] = [paymentMethodId];
    
    if (dateRange) {
      query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total 
        FROM transactions 
        WHERE payment_method_id = $1 AND date BETWEEN $2 AND $3
      `;
      params.push(dateRange.startDate, dateRange.endDate);
    } else {
      query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total 
        FROM transactions 
        WHERE payment_method_id = $1
      `;
    }
    
    const result = await sql.unsafe(query, params);
    return parseFloat(result[0].total || '0');
  }

  async getTotalIncomeForPeriod(dateRange: DateRange): Promise<number> {
    const result = await sql`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'income' 
      AND date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
    `;
    
    return parseFloat(result[0].total || '0');
  }

  async getTotalExpenseForPeriod(dateRange: DateRange): Promise<number> {
    const result = await sql`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total 
      FROM transactions 
      WHERE type = 'expense' 
      AND date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
    `;
    
    return parseFloat(result[0].total || '0');
  }

  async getMonthlyTotals(year: number): Promise<MonthlyTotal[]> {
    const result = await sql`
      SELECT 
        EXTRACT(MONTH FROM date) as month,
        EXTRACT(YEAR FROM date) as year,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expense
      FROM transactions 
      WHERE EXTRACT(YEAR FROM date) = ${year}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY month
    `;
    
    return result.map(row => ({
      month: parseInt(row.month),
      year: parseInt(row.year),
      totalIncome: parseFloat(row.total_income || '0'),
      totalExpense: parseFloat(row.total_expense || '0'),
      net: parseFloat(row.total_income || '0') - parseFloat(row.total_expense || '0')
    }));
  }

  async exists(id: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM transactions WHERE id = ${id} LIMIT 1
    `;
    
    return result.length > 0;
  }

  // Private helper methods
  private mapRowToEntity(row: TransactionRow): Transaction {
    const amount = new Money(Math.abs(row.amount), 'BRL'); // Explicitly BRL as currency is not stored
    const type = row.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;
    const source = this.mapSourceType(row.source_type);
    
    return new Transaction(
      row.id,
      row.date,
      amount,
      row.category_id,
      row.payment_method_id,
      type,
      row.description,
      source,
      row.source_id,
      row.created_at,
      row.updated_at
    );
  }

  private mapSourceType(sourceType: string): TransactionSource {
    switch (sourceType) {
      case 'manual':
        return TransactionSource.MANUAL;
      case 'installment':
        return TransactionSource.INSTALLMENT;
      case 'subscription':
        return TransactionSource.SUBSCRIPTION;
      default:
        return TransactionSource.MANUAL;
    }
  }

  private getAmountForStorage(transaction: Transaction): number {
    // Store income as positive, expenses as negative
    const baseAmount = transaction.amount.amount;
    return transaction.isIncome() ? baseAmount : -baseAmount;
  }
} 