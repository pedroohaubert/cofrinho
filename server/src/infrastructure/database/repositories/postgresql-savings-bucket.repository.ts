import sql from '@/infrastructure/database/connection.js';
import { SavingsBucket } from '@/domain/entities/savings-bucket.js';
import { ISavingsBucketRepository } from '@/domain/repositories/savings-bucket-repository.js';
import { Money } from '@/domain/value-objects/money.js';

interface SavingsBucketRow {
  id: string;
  name: string;
  target_amount: number | null;
  current_balance: number;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PostgreSQLSavingsBucketRepository implements ISavingsBucketRepository {
  
  async save(bucket: SavingsBucket): Promise<void> {
    await sql`
      INSERT INTO savings_buckets (
        id, name, target_amount, current_balance, description, is_active, created_at, updated_at
      ) VALUES (
        ${bucket.id},
        ${bucket.name},
        ${bucket.targetAmount?.amount || null},
        ${bucket.currentBalance.amount},
        ${bucket.description},
        ${bucket.isActive},
        ${bucket.createdAt},
        ${bucket.updatedAt}
      )
    `;
  }

  async findById(id: string): Promise<SavingsBucket | null> {
    const result = await sql<SavingsBucketRow[]>`
      SELECT * FROM savings_buckets WHERE id = ${id}
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async findAll(): Promise<SavingsBucket[]> {
    const result = await sql<SavingsBucketRow[]>`
      SELECT * FROM savings_buckets ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async update(bucket: SavingsBucket): Promise<void> {
    await sql`
      UPDATE savings_buckets 
      SET 
        name = ${bucket.name},
        target_amount = ${bucket.targetAmount?.amount || null},
        current_balance = ${bucket.currentBalance.amount},
        description = ${bucket.description},
        is_active = ${bucket.isActive},
        updated_at = ${new Date()}
      WHERE id = ${bucket.id}
    `;
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM savings_buckets WHERE id = ${id}`;
  }

  async findActiveBuckets(): Promise<SavingsBucket[]> {
    const result = await sql<SavingsBucketRow[]>`
      SELECT * FROM savings_buckets 
      WHERE is_active = true 
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findInactiveBuckets(): Promise<SavingsBucket[]> {
    const result = await sql<SavingsBucketRow[]>`
      SELECT * FROM savings_buckets 
      WHERE is_active = false 
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByName(name: string): Promise<SavingsBucket | null> {
    const result = await sql<SavingsBucketRow[]>`
      SELECT * FROM savings_buckets 
      WHERE LOWER(name) = LOWER(${name}) AND is_active = true
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async findBucketsWithTargets(): Promise<SavingsBucket[]> {
    const result = await sql<SavingsBucketRow[]>`
      SELECT * FROM savings_buckets 
      WHERE target_amount IS NOT NULL AND is_active = true
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findBucketsWithoutTargets(): Promise<SavingsBucket[]> {
    const result = await sql<SavingsBucketRow[]>`
      SELECT * FROM savings_buckets 
      WHERE target_amount IS NULL AND is_active = true
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findTargetReachedBuckets(): Promise<SavingsBucket[]> {
    const result = await sql<SavingsBucketRow[]>`
      SELECT * FROM savings_buckets 
      WHERE target_amount IS NOT NULL 
      AND current_balance >= target_amount 
      AND is_active = true
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async exists(id: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM savings_buckets WHERE id = ${id} LIMIT 1
    `;
    
    return result.length > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    let query;
    let params: any[] = [name];
    
    if (excludeId) {
      query = `
        SELECT 1 FROM savings_buckets 
        WHERE LOWER(name) = LOWER($1) AND is_active = true AND id != $2 
        LIMIT 1
      `;
      params.push(excludeId);
    } else {
      query = `
        SELECT 1 FROM savings_buckets 
        WHERE LOWER(name) = LOWER($1) AND is_active = true 
        LIMIT 1
      `;
    }
    
    const result = await sql.unsafe(query, params);
    return result.length > 0;
  }

  private mapRowToEntity(row: SavingsBucketRow): SavingsBucket {
    const currentBalance = new Money(row.current_balance);
    const targetAmount = row.target_amount ? new Money(row.target_amount) : null;
    
    return new SavingsBucket(
      row.id,
      row.name,
      currentBalance,
      targetAmount,
      row.description,
      row.is_active,
      row.created_at,
      row.updated_at
    );
  }
} 