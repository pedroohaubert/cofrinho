import { Context } from 'hono';
import { CreateSubscriptionUseCase } from '@/application/use-cases/subscription/create-subscription.use-case.js';
import { CancelSubscriptionUseCase } from '@/application/use-cases/subscription/cancel-subscription.use-case.js';
import { PostgreSQLSubscriptionRepository } from '@/infrastructure/database/repositories/postgresql-subscription.repository.js';

export class SubscriptionController {
  constructor(
    private createSubscriptionUseCase: CreateSubscriptionUseCase,
    private cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private subscriptionRepository: PostgreSQLSubscriptionRepository
  ) {}

  async create(c: Context) {
    const body = await c.req.json();
    
    try {
      const result = await this.createSubscriptionUseCase.execute({
        name: body.name,
        monthlyAmount: body.monthlyAmount,
        currency: body.currency || 'BRL',
        startDate: body.startDate,
        categoryId: body.categoryId,
        paymentMethodId: body.paymentMethodId,
      });
      
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(', ') || 'Failed to create subscription',
            code: 'CREATION_FAILED',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 400);
      }
      
      return c.json({
        data: result.subscription,
        message: 'Subscription created successfully'
      }, 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(c: Context) {
    try {
      const subscriptions = await this.subscriptionRepository.findActiveSubscriptions();
      
      return c.json({
        data: subscriptions.map(sub => this.mapToResponse(sub))
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(c: Context) {
    const id = c.req.param('id');
    
    try {
      const subscription = await this.subscriptionRepository.findById(id);
      
      if (!subscription) {
        return c.json({
          error: {
            message: 'Subscription not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      return c.json({
        data: this.mapToResponse(subscription)
      });
    } catch (error) {
      throw error;
    }
  }

  async update(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
      const subscription = await this.subscriptionRepository.findById(id);
      
      if (!subscription) {
        return c.json({
          error: {
            message: 'Subscription not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      if (body.name) subscription.updateName(body.name);
      
      await this.subscriptionRepository.update(subscription);
      
      return c.json({
        data: this.mapToResponse(subscription),
        message: 'Subscription updated successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(c: Context) {
    const id = c.req.param('id');
    
    try {
      const subscription = await this.subscriptionRepository.findById(id);
      
      if (!subscription) {
        return c.json({
          error: {
            message: 'Subscription not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      await this.subscriptionRepository.delete(id);
      
      return c.json({
        message: 'Subscription deleted successfully'
      }, 204);
    } catch (error) {
      throw error;
    }
  }

  async cancel(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
      const result = await this.cancelSubscriptionUseCase.execute(id, {
        endDate: body.endDate,
      });
      
      if (!result.success) {
        const statusCode = result.errors?.some(err => err.includes('not found')) ? 404 : 400;
        return c.json({
          error: {
            message: result.errors?.join(', ') || 'Failed to cancel subscription',
            code: statusCode === 404 ? 'NOT_FOUND' : 'CANCEL_FAILED',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, statusCode);
      }
      
      return c.json({
        data: result.subscription,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  private mapToResponse(subscription: any) {
    return {
      id: subscription.id,
      name: subscription.name,
      monthlyAmount: subscription.monthlyAmount.amount,
      currency: 'BRL',
      startDate: subscription.startDate.toISOString(),
      endDate: subscription.endDate?.toISOString() || null,
      categoryId: subscription.categoryId,
      paymentMethodId: subscription.paymentMethodId,
      status: subscription.status.toLowerCase(),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }
} 