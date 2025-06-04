import { Context } from 'hono';
import { PostgreSQLCategoryRepository } from '../../database/repositories/postgresql-category.repository';
import { Category } from '../../../domain/entities/category';
import { TransactionType } from '../../../domain/value-objects/transaction-type';

export class CategoryController {
  constructor(private categoryRepository: PostgreSQLCategoryRepository) {}

  async create(c: Context) {
    const body = await c.req.json();
    
    try {
      const category = Category.create(
        crypto.randomUUID(),
        body.name,
        body.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
        body.color
      );
      
      await this.categoryRepository.save(category);
      
      return c.json({
        data: {
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase(),
          color: category.color,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
        message: 'Category created successfully'
      }, 201);
    } catch (error) {
      throw error; // Let error middleware handle it
    }
  }

  async findAll(c: Context) {
    try {
      const categories = await this.categoryRepository.findActiveCategories();
      
      return c.json({
        data: categories.map(category => ({
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase(),
          color: category.color,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        }))
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(c: Context) {
    const id = c.req.param('id');
    
    try {
      const category = await this.categoryRepository.findById(id);
      
      if (!category) {
        return c.json({
          error: {
            message: 'Category not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      return c.json({
        data: {
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase(),
          color: category.color,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async update(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
      const category = await this.categoryRepository.findById(id);
      
      if (!category) {
        return c.json({
          error: {
            message: 'Category not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      if (body.name) category.updateName(body.name);
      if (body.color !== undefined) category.updateColor(body.color);
      
      await this.categoryRepository.update(category);
      
      return c.json({
        data: {
          id: category.id,
          name: category.name,
          type: category.type.toLowerCase(),
          color: category.color,
          isActive: category.isActive,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        },
        message: 'Category updated successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(c: Context) {
    const id = c.req.param('id');
    
    try {
      const category = await this.categoryRepository.findById(id);
      
      if (!category) {
        return c.json({
          error: {
            message: 'Category not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      category.deactivate();
      await this.categoryRepository.update(category);
      
      return c.json({
        message: 'Category deleted successfully'
      }, 204);
    } catch (error) {
      throw error;
    }
  }
} 