import { Context } from 'hono';
import { PostgreSQLPaymentMethodRepository } from '@/infrastructure/database/repositories/postgresql-payment-method.repository.js';
import { PaymentMethod, PaymentMethodType } from '@/domain/entities/payment-method.js';

export class PaymentMethodController {
  constructor(private paymentMethodRepository: PostgreSQLPaymentMethodRepository) {}

  async create(c: Context) {
    const body = await c.req.json();
    
    try {
      const paymentMethod = PaymentMethod.create(
        crypto.randomUUID(),
        body.name,
        this.mapTypeFromString(body.type)
      );
      
      await this.paymentMethodRepository.save(paymentMethod);
      
      return c.json({
        data: this.mapToResponse(paymentMethod),
        message: 'Payment method created successfully'
      }, 201);
    } catch (error) {
      throw error; // Let error middleware handle it
    }
  }

  async findAll(c: Context) {
    try {
      const paymentMethods = await this.paymentMethodRepository.findActivePaymentMethods();
      
      return c.json({
        data: paymentMethods.map(pm => this.mapToResponse(pm))
      });
    } catch (error) {
      throw error;
    }
  }

  async findById(c: Context) {
    const id = c.req.param('id');
    
    try {
      const paymentMethod = await this.paymentMethodRepository.findById(id);
      
      if (!paymentMethod) {
        return c.json({
          error: {
            message: 'Payment method not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      return c.json({
        data: this.mapToResponse(paymentMethod)
      });
    } catch (error) {
      throw error;
    }
  }

  async update(c: Context) {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    try {
      const paymentMethod = await this.paymentMethodRepository.findById(id);
      
      if (!paymentMethod) {
        return c.json({
          error: {
            message: 'Payment method not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      if (body.name) paymentMethod.updateName(body.name);
      
      await this.paymentMethodRepository.update(paymentMethod);
      
      return c.json({
        data: this.mapToResponse(paymentMethod),
        message: 'Payment method updated successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(c: Context) {
    const id = c.req.param('id');
    
    try {
      const paymentMethod = await this.paymentMethodRepository.findById(id);
      
      if (!paymentMethod) {
        return c.json({
          error: {
            message: 'Payment method not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 404);
      }
      
      paymentMethod.deactivate();
      await this.paymentMethodRepository.update(paymentMethod);
      
      return c.json({
        message: 'Payment method deleted successfully'
      }, 204);
    } catch (error) {
      throw error;
    }
  }

  private mapTypeFromString(type: string): PaymentMethodType {
    switch (type.toLowerCase()) {
      case 'cash':
        return PaymentMethodType.CASH;
      case 'bank':
        return PaymentMethodType.BANK;
      case 'credit_card':
        return PaymentMethodType.CREDIT_CARD;
      default:
        throw new Error(`Invalid payment method type: ${type}`);
    }
  }

  private mapToResponse(paymentMethod: PaymentMethod) {
    return {
      id: paymentMethod.id,
      name: paymentMethod.name,
      type: paymentMethod.type.toLowerCase(),
      isActive: paymentMethod.isActive,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
    };
  }
} 