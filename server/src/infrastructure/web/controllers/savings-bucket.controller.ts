import { Context } from 'hono';
import { CreateSavingsBucketUseCase } from '@/application/use-cases/savings-bucket/create-savings-bucket.use-case.js';
import { TransferToBucketUseCase } from '@/application/use-cases/savings-bucket/transfer-to-bucket.use-case.js';
import { PostgreSQLSavingsBucketRepository } from '@/infrastructure/database/repositories/postgresql-savings-bucket.repository.js';

export class SavingsBucketController {
  constructor(
    private createSavingsBucketUseCase: CreateSavingsBucketUseCase,
    private transferToBucketUseCase: TransferToBucketUseCase,
    private savingsBucketRepository: PostgreSQLSavingsBucketRepository
  ) {}

  async create(c: Context) {
    const body = await c.req.json();
    
    try {
      const result = await this.createSavingsBucketUseCase.execute({
        name: body.name,
        targetAmount: body.targetAmount,
        currency: body.currency || 'BRL',
        description: body.description,
      });
      
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(', ') || 'Failed to create savings bucket',
            code: 'CREATION_FAILED',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 400);
      }
      
      return c.json({
        data: result.bucket,
        message: 'Savings bucket created successfully'
      }, 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(c: Context) {
    try {
      const buckets = await this.savingsBucketRepository.findActiveBuckets();
      
      return c.json({
        data: buckets.map(bucket => this.mapToResponse(bucket))
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(c: Context) {
    const id = c.req.param('id');
    
    try {
      const bucket = await this.savingsBucketRepository.findById(id);
      
      if (!bucket) {
        return c.json({
          error: {
            message: 'Savings bucket not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      return c.json({
        data: this.mapToResponse(bucket)
      });
    } catch (error) {
      throw error;
    }
  }

  async update(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
      const bucket = await this.savingsBucketRepository.findById(id);
      
      if (!bucket) {
        return c.json({
          error: {
            message: 'Savings bucket not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      if (body.name) bucket.updateName(body.name);
      if (body.description !== undefined) bucket.updateDescription(body.description);
      
      await this.savingsBucketRepository.update(bucket);
      
      return c.json({
        data: this.mapToResponse(bucket),
        message: 'Savings bucket updated successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(c: Context) {
    const id = c.req.param('id');
    
    try {
      const bucket = await this.savingsBucketRepository.findById(id);
      
      if (!bucket) {
        return c.json({
          error: {
            message: 'Savings bucket not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      bucket.deactivate();
      await this.savingsBucketRepository.update(bucket);
      
      return c.json({
        message: 'Savings bucket deleted successfully'
      }, 204);
    } catch (error) {
      throw error;
    }
  }

  async transfer(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
      const result = await this.transferToBucketUseCase.execute(id, {
        amount: body.amount,
        currency: body.currency || 'BRL',
        type: body.type || 'deposit',
        description: body.description,
      });
      
      if (!result.success) {
        const statusCode = result.errors?.some(err => err.includes('not found')) ? 404 : 400;
        return c.json({
          error: {
            message: result.errors?.join(', ') || 'Failed to transfer to bucket',
            code: statusCode === 404 ? 'NOT_FOUND' : 'TRANSFER_FAILED',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, statusCode);
      }
      
      return c.json({
        data: result.transfer,
        message: 'Transfer completed successfully'
      }, 201);
    } catch (error) {
      throw error;
    }
  }

  private mapToResponse(bucket: any) {
    return {
      id: bucket.id,
      name: bucket.name,
      currentBalance: bucket.currentBalance.amount,
      targetAmount: bucket.targetAmount?.amount || null,
      currency: 'BRL',
      description: bucket.description,
      isActive: bucket.isActive,
      progress: bucket.targetAmount ? (bucket.currentBalance.amount / bucket.targetAmount.amount) * 100 : null,
      createdAt: bucket.createdAt.toISOString(),
      updatedAt: bucket.updatedAt.toISOString(),
    };
  }
} 