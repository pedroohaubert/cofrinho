import sql from '@/infrastructure/database/connection.js';
import { Category } from '@/domain/entities/category.js';
import { ICategoryRepository } from '@/domain/repositories/category-repository.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';

interface CategoryRow {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PostgreSQLCategoryRepository implements ICategoryRepository {
  
  async save(category: Category): Promise<void> {
    await sql`
      INSERT INTO categories (
        id, name, type, color, is_active, created_at, updated_at
      ) VALUES (
        ${category.id},
        ${category.name},
        ${category.type.toLowerCase()},
        ${category.color},
        ${category.isActive},
        ${category.createdAt},
        ${category.updatedAt}
      )
    `;
  }

  async findById(id: string): Promise<Category | null> {
    const result = await sql<CategoryRow[]>`
      SELECT * FROM categories WHERE id = ${id}
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async findAll(): Promise<Category[]> {
    const result = await sql<CategoryRow[]>`
      SELECT * FROM categories ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async update(category: Category): Promise<void> {
    await sql`
      UPDATE categories 
      SET 
        name = ${category.name},
        color = ${category.color},
        is_active = ${category.isActive},
        updated_at = ${new Date()}
      WHERE id = ${category.id}
    `;
  }

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM categories WHERE id = ${id}`;
  }

  async findByType(type: TransactionType): Promise<Category[]> {
    const result = await sql<CategoryRow[]>`
      SELECT * FROM categories 
      WHERE type = ${type.toLowerCase()} AND is_active = true
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findActiveCategories(): Promise<Category[]> {
    const result = await sql<CategoryRow[]>`
      SELECT * FROM categories 
      WHERE is_active = true 
      ORDER BY type, name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findInactiveCategories(): Promise<Category[]> {
    const result = await sql<CategoryRow[]>`
      SELECT * FROM categories 
      WHERE is_active = false 
      ORDER BY name ASC
    `;
    
    return result.map(row => this.mapRowToEntity(row));
  }

  async findByName(name: string): Promise<Category | null> {
    const result = await sql<CategoryRow[]>`
      SELECT * FROM categories 
      WHERE LOWER(name) = LOWER(${name}) AND is_active = true
    `;
    
    return result.length > 0 ? this.mapRowToEntity(result[0]) : null;
  }

  async exists(id: string): Promise<boolean> {
    const result = await sql`
      SELECT 1 FROM categories WHERE id = ${id} LIMIT 1
    `;
    
    return result.length > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    let query;
    let params: any[] = [name];
    
    if (excludeId) {
      query = `
        SELECT 1 FROM categories 
        WHERE LOWER(name) = LOWER($1) AND is_active = true AND id != $2 
        LIMIT 1
      `;
      params.push(excludeId);
    } else {
      query = `
        SELECT 1 FROM categories 
        WHERE LOWER(name) = LOWER($1) AND is_active = true 
        LIMIT 1
      `;
    }
    
    const result = await sql.unsafe(query, params);
    return result.length > 0;
  }

  private mapRowToEntity(row: CategoryRow): Category {
    const type = row.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;
    
    return new Category(
      row.id,
      row.name,
      type,
      row.color,
      row.is_active,
      row.created_at,
      row.updated_at
    );
  }
} 