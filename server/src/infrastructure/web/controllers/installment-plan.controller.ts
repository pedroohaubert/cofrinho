import { Context } from 'hono';
import { CreateInstallmentPlanUseCase } from '@/application/use-cases/installment/create-installment-plan.use-case.js';
import { PostgreSQLInstallmentPlanRepository } from '@/infrastructure/database/repositories/postgresql-installment-plan.repository.js';

export class InstallmentPlanController {
  constructor(
    private createInstallmentPlanUseCase: CreateInstallmentPlanUseCase,
    private installmentPlanRepository: PostgreSQLInstallmentPlanRepository
  ) {}

  async create(c: Context) {
    const body = await c.req.json();
    
    try {
      const result = await this.createInstallmentPlanUseCase.execute({
        totalAmount: body.totalAmount,
        currency: body.currency || 'BRL',
        purchaseDate: body.purchaseDate,
        installmentCount: body.installmentCount,
        description: body.description,
        paymentMethodId: body.paymentMethodId,
        categoryId: body.categoryId,
      });
      
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(', ') || 'Failed to create installment plan',
            code: 'CREATION_FAILED',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 400);
      }
      
      return c.json({
        data: result.installmentPlan,
        message: 'Installment plan created successfully'
      }, 201);
    } catch (error) {
      throw error;
    }
  }

  async findAll(c: Context) {
    try {
      const installmentPlans = await this.installmentPlanRepository.findActiveInstallmentPlans();
      
      return c.json({
        data: installmentPlans.map(plan => this.mapToResponse(plan))
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(c: Context) {
    const id = c.req.param('id');
    
    try {
      const installmentPlan = await this.installmentPlanRepository.findById(id);
      
      if (!installmentPlan) {
        return c.json({
          error: {
            message: 'Installment plan not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      return c.json({
        data: this.mapToResponse(installmentPlan)
      });
    } catch (error) {
      throw error;
    }
  }

  async update(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
      const installmentPlan = await this.installmentPlanRepository.findById(id);
      
      if (!installmentPlan) {
        return c.json({
          error: {
            message: 'Installment plan not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      if (body.description) installmentPlan.updateDescription(body.description);
      
      await this.installmentPlanRepository.update(installmentPlan);
      
      return c.json({
        data: this.mapToResponse(installmentPlan),
        message: 'Installment plan updated successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(c: Context) {
    const id = c.req.param('id');
    
    try {
      const installmentPlan = await this.installmentPlanRepository.findById(id);
      
      if (!installmentPlan) {
        return c.json({
          error: {
            message: 'Installment plan not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      installmentPlan.cancel();
      await this.installmentPlanRepository.update(installmentPlan);
      
      return c.json({
        message: 'Installment plan cancelled successfully'
      }, 204);
    } catch (error) {
      throw error;
    }
  }

  private mapToResponse(installmentPlan: any) {
    return {
      id: installmentPlan.id,
      totalAmount: installmentPlan.totalAmount.amount,
      monthlyAmount: installmentPlan.monthlyAmount.amount,
      currency: 'BRL',
      purchaseDate: installmentPlan.purchaseDate.toISOString(),
      installmentCount: installmentPlan.installmentCount,
      description: installmentPlan.description,
      paymentMethodId: installmentPlan.paymentMethodId,
      categoryId: installmentPlan.categoryId,
      status: installmentPlan.status.toLowerCase(),
      createdAt: installmentPlan.createdAt.toISOString(),
      updatedAt: installmentPlan.updatedAt.toISOString(),
    };
  }
} 