import { BucketTransfer, BucketTransferType } from '../entities/bucket-transfer.js';
import { DateRange } from '../value-objects/date-range.js';

export interface IBucketTransferRepository {
  save(transfer: BucketTransfer): Promise<void>;
  findById(id: string): Promise<BucketTransfer | null>;
  findAll(): Promise<BucketTransfer[]>;
  update(transfer: BucketTransfer): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByBucket(bucketId: string): Promise<BucketTransfer[]>;
  findByType(type: BucketTransferType): Promise<BucketTransfer[]>;
  findByDateRange(dateRange: DateRange): Promise<BucketTransfer[]>;
  findByMonth(year: number, month: number): Promise<BucketTransfer[]>;
  findByYear(year: number): Promise<BucketTransfer[]>;
  findByBucketAndDateRange(bucketId: string, dateRange: DateRange): Promise<BucketTransfer[]>;
  
  // Aggregation methods
  getTotalByBucket(bucketId: string, type?: BucketTransferType): Promise<number>;
  getTotalByBucketAndDateRange(
    bucketId: string, 
    dateRange: DateRange, 
    type?: BucketTransferType
  ): Promise<number>;
  
  // Validation support
  exists(id: string): Promise<boolean>;
} 