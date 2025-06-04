import sql from '@/infrastructure/database/connection.js';
import { BucketTransfer, BucketTransferType } from '@/domain/entities/bucket-transfer.js';
import { IBucketTransferRepository } from '@/domain/repositories/bucket-transfer-repository.js';
import { Money } from '@/domain/value-objects/money.js';
import { DateRange } from '@/domain/value-objects/date-range.js';

interface BucketTransferRow {
  id: string;
  bucket_id: string;
  amount: number;
  transfer_date: Date;
  description: string | null;
  created_at: Date;
}

export class PostgreSQLBucketTransferRepository implements IBucketTransferRepository {
  
  async save(transfer: BucketTransfer): Promise<void> {
    await sql`
      INSERT INTO bucket_transfers (
        id, bucket_id, amount, transfer_date, description, created_at
      ) VALUES (
        ${transfer.id},
        ${transfer.bucketId},
        ${transfer.amount.amount},
        ${transfer.date},
        ${transfer.description},
        ${transfer.createdAt}
      )
    `;
  }

  async findById(id: string): Promise<BucketTransfer | null> {
    const result = await sql<BucketTransferRow[]>`
      SELECT * FROM bucket_transfers WHERE id = ${id}
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async findAll(): Promise<BucketTransfer[]> {
    const result = await sql<BucketTransferRow[]>`
      SELECT * FROM bucket_transfers ORDER BY transfer_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async update(transfer: BucketTransfer): Promise<void> {
    await sql`
      UPDATE bucket_transfers 
      SET 
        amount = ${transfer.amount.amount},
        transfer_date = ${transfer.date},
        description = ${transfer.description}
      WHERE id = ${transfer.id}
    `;
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM bucket_transfers WHERE id = ${id}`;
  }

  async findByBucket(bucketId: string): Promise<BucketTransfer[]> {
    const result = await sql<BucketTransferRow[]>`
      SELECT * FROM bucket_transfers 
      WHERE bucket_id = ${bucketId}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByBucketAndDateRange(bucketId: string, dateRange: DateRange): Promise<BucketTransfer[]> {
    const result = await sql<BucketTransferRow[]>`
      SELECT * FROM bucket_transfers 
      WHERE bucket_id = ${bucketId}
      AND transfer_date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByDateRange(dateRange: DateRange): Promise<BucketTransfer[]> {
    const result = await sql<BucketTransferRow[]>`
      SELECT * FROM bucket_transfers 
      WHERE transfer_date BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async getTotalTransfersByBucket(bucketId: string, dateRange?: DateRange): Promise<number> {
    let query;
    let params: any[] = [bucketId];
    
    if (dateRange) {
      query = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM bucket_transfers 
        WHERE bucket_id = $1 AND transfer_date BETWEEN $2 AND $3
      `;
      params.push(dateRange.startDate, dateRange.endDate);
    } else {
      query = `
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM bucket_transfers 
        WHERE bucket_id = $1
      `;
    }
    
    const result = await sql.unsafe(query, params);
    return parseFloat(result[0].total || '0');
  }

  async findByType(type: BucketTransferType): Promise<BucketTransfer[]> {
    // Since database doesn't have type field, we determine by amount sign
    // Positive amounts = deposits, negative = withdrawals (this is a temporary solution)
    const operator = type === BucketTransferType.DEPOSIT ? '>=' : '<';
    
    const result = await sql<BucketTransferRow[]>`
      SELECT * FROM bucket_transfers 
      WHERE amount ${sql.unsafe(operator)} 0
      ORDER BY transfer_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByMonth(year: number, month: number): Promise<BucketTransfer[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const result = await sql<BucketTransferRow[]>`
      SELECT * FROM bucket_transfers 
      WHERE transfer_date >= ${startDate} AND transfer_date <= ${endDate}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByYear(year: number): Promise<BucketTransfer[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    const result = await sql<BucketTransferRow[]>`
      SELECT * FROM bucket_transfers 
      WHERE transfer_date >= ${startDate} AND transfer_date <= ${endDate}
      ORDER BY transfer_date DESC, created_at DESC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async getTotalByBucket(bucketId: string, type?: BucketTransferType): Promise<number> {
    let query = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM bucket_transfers 
      WHERE bucket_id = $1
    `;
    const params: any[] = [bucketId];
    
    if (type) {
      if (type === BucketTransferType.DEPOSIT) {
        query += ` AND amount >= 0`;
      } else {
        query += ` AND amount < 0`;
      }
    }
    
    const result = await sql.unsafe(query, params);
    return parseFloat(result[0].total || '0');
  }

  async getTotalByBucketAndDateRange(
    bucketId: string, 
    dateRange: DateRange, 
    type?: BucketTransferType
  ): Promise<number> {
    let query = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM bucket_transfers 
      WHERE bucket_id = $1 AND transfer_date BETWEEN $2 AND $3
    `;
    const params: any[] = [bucketId, dateRange.startDate, dateRange.endDate];
    
    if (type) {
      if (type === BucketTransferType.DEPOSIT) {
        query += ` AND amount >= 0`;
      } else {
        query += ` AND amount < 0`;
      }
    }
    
    const result = await sql.unsafe(query, params);
    return parseFloat(result[0].total || '0');
  }

  async exists(id: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM bucket_transfers WHERE id = ${id} LIMIT 1
    `;
    
    return result.length > 0;
  }

  private mapRowToEntity(row: BucketTransferRow): BucketTransfer {
    // Amount from DB is signed. Currency is assumed 'BRL' as it's not stored.
    const amount = new Money(row.amount, 'BRL');
    const type = row.amount >= 0 ? BucketTransferType.DEPOSIT : BucketTransferType.WITHDRAWAL;
    
    return new BucketTransfer(
      row.id,
      row.transfer_date,
      amount,
      type,
      row.bucket_id,
      row.description,
      row.created_at
    );
  }
} 