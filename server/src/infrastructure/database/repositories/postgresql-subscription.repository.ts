import sql from '@/infrastructure/database/connection.js';
import { Subscription, SubscriptionStatus } from '@/domain/entities/subscription.js';
import { ISubscriptionRepository } from '@/domain/repositories/subscription-repository.js';
import { Money } from '@/domain/value-objects/money.js';

interface SubscriptionRow {
  id: string;
  name: string;
  monthly_amount: number;
  start_date: Date;
  end_date: Date | null;
  category_id: string;
  payment_method_id: string;
  status: 'active' | 'cancelled' | 'paused';
  created_at: Date;
  updated_at: Date;
}

export class PostgreSQLSubscriptionRepository implements ISubscriptionRepository {
  
  async save(subscription: Subscription): Promise<void> {
    await sql`
      INSERT INTO subscriptions (
        id, name, monthly_amount, start_date, end_date,
        category_id, payment_method_id, status, created_at, updated_at
      ) VALUES (
        ${subscription.id},
        ${subscription.name},
        ${subscription.monthlyAmount.amount},
        ${subscription.startDate},
        ${subscription.endDate},
        ${subscription.categoryId},
        ${subscription.paymentMethodId},
        ${subscription.status.toLowerCase()},
        ${subscription.createdAt},
        ${subscription.updatedAt}
      )
    `;
  }

  async findById(id: string): Promise<Subscription | null> {
    const result = await sql<SubscriptionRow[]>`
      SELECT * FROM subscriptions WHERE id = ${id}
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async findAll(): Promise<Subscription[]> {
    const result = await sql<SubscriptionRow[]>`
      SELECT * FROM subscriptions ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async update(subscription: Subscription): Promise<void> {
    await sql`
      UPDATE subscriptions 
      SET 
        name = ${subscription.name},
        monthly_amount = ${subscription.monthlyAmount.amount},
        end_date = ${subscription.endDate},
        category_id = ${subscription.categoryId},
        payment_method_id = ${subscription.paymentMethodId},
        status = ${subscription.status.toLowerCase()},
        updated_at = ${new Date()}
      WHERE id = ${subscription.id}
    `;
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM subscriptions WHERE id = ${id}`;
  }

  async findByStatus(status: SubscriptionStatus): Promise<Subscription[]> {
    const result = await sql<SubscriptionRow[]>`
      SELECT * FROM subscriptions 
      WHERE status = ${status.toLowerCase()}
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findActiveForMonth(year: number, month: number): Promise<Subscription[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const result = await sql<SubscriptionRow[]>`
      SELECT * FROM subscriptions 
      WHERE status = 'active'
      AND start_date <= ${endDate}
      AND (end_date IS NULL OR end_date >= ${startDate})
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findActiveSubscriptions(): Promise<Subscription[]> {
    const result = await sql<SubscriptionRow[]>`
      SELECT * FROM subscriptions 
      WHERE status = 'active'
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByCategory(categoryId: string): Promise<Subscription[]> {
    const result = await sql<SubscriptionRow[]>`
      SELECT * FROM subscriptions 
      WHERE category_id = ${categoryId}
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByPaymentMethod(paymentMethodId: string): Promise<Subscription[]> {
    const result = await sql<SubscriptionRow[]>`
      SELECT * FROM subscriptions 
      WHERE payment_method_id = ${paymentMethodId}
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByName(name: string): Promise<Subscription | null> {
    const result = await sql<SubscriptionRow[]>`
      SELECT * FROM subscriptions 
      WHERE LOWER(name) = LOWER(${name}) AND status = 'active'
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async exists(id: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM subscriptions WHERE id = ${id} LIMIT 1
    `;
    
    return result.length > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    let query;
    let params: any[] = [name];
    
    if (excludeId) {
      query = `
        SELECT 1 FROM subscriptions 
        WHERE LOWER(name) = LOWER($1) AND status = 'active' AND id != $2 
        LIMIT 1
      `;
      params.push(excludeId);
    } else {
      query = `
        SELECT 1 FROM subscriptions 
        WHERE LOWER(name) = LOWER($1) AND status = 'active' 
        LIMIT 1
      `;
    }
    
    const result = await sql.unsafe(query, params);
    return result.length > 0;
  }

  private mapRowToEntity(row: SubscriptionRow): Subscription {
    const monthlyAmount = new Money(row.monthly_amount, 'BRL'); // Explicitly BRL as currency is not stored
    const status = this.mapStatusFromDatabase(row.status);
    
    return new Subscription(
      row.id,
      row.name,
      monthlyAmount,
      row.start_date,
      row.category_id,
      row.payment_method_id,
      row.end_date,
      status,
      row.created_at,
      row.updated_at
    );
  }

  private mapStatusFromDatabase(status: string): SubscriptionStatus {
    switch (status) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'cancelled':
        return SubscriptionStatus.CANCELLED;
      case 'paused':
        return SubscriptionStatus.PAUSED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }
} 