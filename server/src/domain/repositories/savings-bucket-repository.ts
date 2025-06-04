import { SavingsBucket } from '@/domain/entities/savings-bucket.js';

export interface ISavingsBucketRepository {
  save(bucket: SavingsBucket): Promise<void>;
  findById(id: string): Promise<SavingsBucket | null>;
  findAll(): Promise<SavingsBucket[]>;
  update(bucket: SavingsBucket): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findActiveBuckets(): Promise<SavingsBucket[]>;
  findInactiveBuckets(): Promise<SavingsBucket[]>;
  findByName(name: string): Promise<SavingsBucket | null>;
  findBucketsWithTargets(): Promise<SavingsBucket[]>;
  findBucketsWithoutTargets(): Promise<SavingsBucket[]>;
  findTargetReachedBuckets(): Promise<SavingsBucket[]>;
  
  // Validation support
  exists(id: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
} 