import sql from '@/infrastructure/database/connection.js';
import { InstallmentPlan, InstallmentPlanStatus } from '@/domain/entities/installment-plan.js';
import { IInstallmentPlanRepository } from '@/domain/repositories/installment-plan-repository.js';
import { Money } from '@/domain/value-objects/money.js';

interface InstallmentPlanRow {
  id: string;
  total_amount: number;
  purchase_date: Date;
  installment_count: number;
  monthly_amount: number;
  description: string | null;
  payment_method_id: string;
  category_id: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

export class PostgreSQLInstallmentPlanRepository implements IInstallmentPlanRepository {
  
  async save(installmentPlan: InstallmentPlan): Promise<void> {
    await sql`
      INSERT INTO installment_plans (
        id, total_amount, purchase_date, installment_count, monthly_amount,
        description, payment_method_id, category_id, status, created_at, updated_at
      ) VALUES (
        ${installmentPlan.id},
        ${installmentPlan.totalAmount.amount},
        ${installmentPlan.purchaseDate},
        ${installmentPlan.installmentCount},
        ${installmentPlan.monthlyAmount.amount},
        ${installmentPlan.description},
        ${installmentPlan.paymentMethodId},
        ${installmentPlan.categoryId},
        ${installmentPlan.status.toLowerCase()},
        ${installmentPlan.createdAt},
        ${installmentPlan.updatedAt}
      )
    `;
  }

  async findById(id: string): Promise<InstallmentPlan | null> {
    const result = await sql<InstallmentPlanRow[]>`
      SELECT * FROM installment_plans WHERE id = ${id}
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async findAll(): Promise<InstallmentPlan[]> {
    const result = await sql<InstallmentPlanRow[]>`
      SELECT * FROM installment_plans ORDER BY purchase_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async update(installmentPlan: InstallmentPlan): Promise<void> {
    await sql`
      UPDATE installment_plans 
      SET 
        description = ${installmentPlan.description},
        status = ${installmentPlan.status.toLowerCase()},
        updated_at = ${new Date()}
      WHERE id = ${installmentPlan.id}
    `;
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM installment_plans WHERE id = ${id}`;
  }

  async findByStatus(status: InstallmentPlanStatus): Promise<InstallmentPlan[]> {
    const result = await sql<InstallmentPlanRow[]>`
      SELECT * FROM installment_plans 
      WHERE status = ${status.toLowerCase()}
      ORDER BY purchase_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findActiveInstallmentPlans(): Promise<InstallmentPlan[]> {
    const result = await sql<InstallmentPlanRow[]>`
      SELECT * FROM installment_plans 
      WHERE status = 'active'
      ORDER BY purchase_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByCategory(categoryId: string): Promise<InstallmentPlan[]> {
    const result = await sql<InstallmentPlanRow[]>`
      SELECT * FROM installment_plans 
      WHERE category_id = ${categoryId}
      ORDER BY purchase_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByPaymentMethod(paymentMethodId: string): Promise<InstallmentPlan[]> {
    const result = await sql<InstallmentPlanRow[]>`
      SELECT * FROM installment_plans 
      WHERE payment_method_id = ${paymentMethodId}
      ORDER BY purchase_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<InstallmentPlan[]> {
    const result = await sql<InstallmentPlanRow[]>`
      SELECT * FROM installment_plans 
      WHERE purchase_date BETWEEN ${startDate} AND ${endDate}
      ORDER BY purchase_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findPendingInstallmentsForMonth(year: number, month: number): Promise<InstallmentPlan[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const result = await sql<InstallmentPlanRow[]>`
      SELECT * FROM installment_plans 
      WHERE status = 'active'
      AND purchase_date <= ${endDate}
      ORDER BY purchase_date ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async exists(id: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM installment_plans WHERE id = ${id} LIMIT 1
    `;
    
    return result.length > 0;
  }

  private mapRowToEntity(row: InstallmentPlanRow): InstallmentPlan {
    const totalAmount = new Money(row.total_amount);
    const status = this.mapStatusFromDatabase(row.status);
    
    return new InstallmentPlan(
      row.id,
      totalAmount,
      row.purchase_date,
      row.installment_count,
      row.description || '',
      row.payment_method_id,
      row.category_id,
      status,
      row.created_at,
      row.updated_at
    );
  }

  private mapStatusFromDatabase(status: string): InstallmentPlanStatus {
    switch (status) {
      case 'active':
        return InstallmentPlanStatus.ACTIVE;
      case 'completed':
        return InstallmentPlanStatus.COMPLETED;
      case 'cancelled':
        return InstallmentPlanStatus.CANCELLED;
      default:
        return InstallmentPlanStatus.ACTIVE;
    }
  }
} 