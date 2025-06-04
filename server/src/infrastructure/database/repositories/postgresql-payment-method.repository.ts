import sql from '@/infrastructure/database/connection.js';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method.js';
import { IPaymentMethodRepository } from '@/domain/repositories/payment-method-repository.js';

interface PaymentMethodRow {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit_card';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PostgreSQLPaymentMethodRepository implements IPaymentMethodRepository {
  
  async save(paymentMethod: PaymentMethod): Promise<void> {
    await sql`
      INSERT INTO payment_methods (
        id, name, type, is_active, created_at, updated_at
      ) VALUES (
        ${paymentMethod.id},
        ${paymentMethod.name},
        ${paymentMethod.type.toLowerCase()},
        ${paymentMethod.isActive},
        ${paymentMethod.createdAt},
        ${paymentMethod.updatedAt}
      )
    `;
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const result = await sql<PaymentMethodRow[]>`
      SELECT * FROM payment_methods WHERE id = ${id}
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async findAll(): Promise<PaymentMethod[]> {
    const result = await sql<PaymentMethodRow[]>`
      SELECT * FROM payment_methods ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async update(paymentMethod: PaymentMethod): Promise<void> {
    await sql`
      UPDATE payment_methods 
      SET 
        name = ${paymentMethod.name},
        is_active = ${paymentMethod.isActive},
        updated_at = ${new Date()}
      WHERE id = ${paymentMethod.id}
    `;
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM payment_methods WHERE id = ${id}`;
  }

  async findActivePaymentMethods(): Promise<PaymentMethod[]> {
    const result = await sql<PaymentMethodRow[]>`
      SELECT * FROM payment_methods 
      WHERE is_active = true 
      ORDER BY type, name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findInactivePaymentMethods(): Promise<PaymentMethod[]> {
    const result = await sql<PaymentMethodRow[]>`
      SELECT * FROM payment_methods 
      WHERE is_active = false 
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByName(name: string): Promise<PaymentMethod | null> {
    const result = await sql<PaymentMethodRow[]>`
      SELECT * FROM payment_methods 
      WHERE LOWER(name) = LOWER(${name}) AND is_active = true
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async exists(id: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM payment_methods WHERE id = ${id} LIMIT 1
    `;
    
    return result.length > 0;
  }

  async findByType(type: PaymentMethodType): Promise<PaymentMethod[]> {
    const result = await sql<PaymentMethodRow[]>`
      SELECT * FROM payment_methods 
      WHERE type = ${type.toLowerCase()} AND is_active = true
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findSupportingInstallments(): Promise<PaymentMethod[]> {
    const result = await sql<PaymentMethodRow[]>`
      SELECT * FROM payment_methods 
      WHERE type IN ('credit_card', 'bank') AND is_active = true
      ORDER BY type, name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    let query;
    let params: any[] = [name];
    
    if (excludeId) {
      query = `
        SELECT 1 FROM payment_methods 
        WHERE LOWER(name) = LOWER($1) AND is_active = true AND id != $2 
        LIMIT 1
      `;
      params.push(excludeId);
    } else {
      query = `
        SELECT 1 FROM payment_methods 
        WHERE LOWER(name) = LOWER($1) AND is_active = true 
        LIMIT 1
      `;
    }
    
    const result = await sql.unsafe(query, params);
    return result.length > 0;
  }

  private mapRowToEntity(row: PaymentMethodRow): PaymentMethod {
    const type = this.mapTypeFromDatabase(row.type);
    return new PaymentMethod(
      row.id,
      row.name,
      type,
      row.is_active,
      row.created_at,
      row.updated_at
    );
  }

  private mapTypeFromDatabase(type: string): PaymentMethodType {
    switch (type) {
      case 'cash':
        return PaymentMethodType.CASH;
      case 'bank':
        return PaymentMethodType.BANK;
      case 'credit_card':
        return PaymentMethodType.CREDIT_CARD;
      default:
        return PaymentMethodType.CASH;
    }
  }
} 