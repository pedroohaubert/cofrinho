import { Category } from '../entities/category.js';
import { TransactionType } from '../value-objects/transaction-type.js';

export interface ICategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  update(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByType(type: TransactionType): Promise<Category[]>;
  findActiveCategories(): Promise<Category[]>;
  findInactiveCategories(): Promise<Category[]>;
  findByName(name: string): Promise<Category | null>;
  
  // Validation support
  exists(id: string): Promise<boolean>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
} 