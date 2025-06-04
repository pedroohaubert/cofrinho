import { Money } from '../value-objects/money.js';

export enum InstallmentPlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class InstallmentPlan {
  private readonly _id: string;
  private readonly _totalAmount: Money;
  private readonly _purchaseDate: Date;
  private readonly _installmentCount: number;
  private readonly _monthlyAmount: Money;
  private _description: string;
  private readonly _paymentMethodId: string;
  private readonly _categoryId: string;
  private _status: InstallmentPlanStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    totalAmount: Money,
    purchaseDate: Date,
    installmentCount: number,
    description: string,
    paymentMethodId: string,
    categoryId: string,
    status: InstallmentPlanStatus = InstallmentPlanStatus.ACTIVE,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.validateId(id);
    this.validateTotalAmount(totalAmount);
    this.validatePurchaseDate(purchaseDate);
    this.validateInstallmentCount(installmentCount);
    this.validateDescription(description);
    this.validatePaymentMethodId(paymentMethodId);
    this.validateCategoryId(categoryId);

    this._id = id;
    this._totalAmount = totalAmount;
    this._purchaseDate = new Date(purchaseDate);
    this._installmentCount = installmentCount;
    this._monthlyAmount = totalAmount.divide(installmentCount);
    this._description = description.trim();
    this._paymentMethodId = paymentMethodId;
    this._categoryId = categoryId;
    this._status = status;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): string {
    return this._id;
  }

  get totalAmount(): Money {
    return this._totalAmount;
  }

  get purchaseDate(): Date {
    return new Date(this._purchaseDate);
  }

  get installmentCount(): number {
    return this._installmentCount;
  }

  get monthlyAmount(): Money {
    return this._monthlyAmount;
  }

  get description(): string {
    return this._description;
  }

  get paymentMethodId(): string {
    return this._paymentMethodId;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  get status(): InstallmentPlanStatus {
    return this._status;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  updateDescription(description: string): void {
    this.validateDescription(description);
    this._description = description.trim();
    this._updatedAt = new Date();
  }

  complete(): void {
    if (this._status === InstallmentPlanStatus.CANCELLED) {
      throw new Error('Cannot complete a cancelled installment plan');
    }
    this._status = InstallmentPlanStatus.COMPLETED;
    this._updatedAt = new Date();
  }

  cancel(): void {
    if (this._status === InstallmentPlanStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed installment plan');
    }
    this._status = InstallmentPlanStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  isActive(): boolean {
    return this._status === InstallmentPlanStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this._status === InstallmentPlanStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this._status === InstallmentPlanStatus.CANCELLED;
  }

  calculateInstallmentDates(): Date[] {
    const dates: Date[] = [];
    
    for (let i = 0; i < this._installmentCount; i++) {
      const installmentDate = new Date(this._purchaseDate);
      installmentDate.setMonth(installmentDate.getMonth() + i);
      dates.push(installmentDate);
    }
    
    return dates;
  }

  getInstallmentDateForIndex(index: number): Date {
    if (index < 0 || index >= this._installmentCount) {
      throw new Error(`Installment index must be between 0 and ${this._installmentCount - 1}`);
    }
    
    const installmentDate = new Date(this._purchaseDate);
    installmentDate.setMonth(installmentDate.getMonth() + index);
    return installmentDate;
  }

  getRemainingAmount(paidInstallments: number): Money {
    if (paidInstallments < 0 || paidInstallments > this._installmentCount) {
      throw new Error(`Paid installments must be between 0 and ${this._installmentCount}`);
    }
    
    const remainingInstallments = this._installmentCount - paidInstallments;
    return this._monthlyAmount.multiply(remainingInstallments);
  }

  equals(other: InstallmentPlan): boolean {
    return this._id === other._id;
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Installment plan ID cannot be empty');
    }
  }

  private validateTotalAmount(totalAmount: Money): void {
    if (!totalAmount) {
      throw new Error('Total amount is required');
    }
    if (totalAmount.amount <= 0) {
      throw new Error('Total amount must be positive');
    }
  }

  private validatePurchaseDate(purchaseDate: Date): void {
    if (!purchaseDate || isNaN(purchaseDate.getTime())) {
      throw new Error('Invalid purchase date');
    }
    
    const now = new Date();
    const futureLimit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (purchaseDate > futureLimit) {
      throw new Error('Purchase date cannot be more than 1 year in the future');
    }
  }

  private validateInstallmentCount(installmentCount: number): void {
    if (!Number.isInteger(installmentCount) || installmentCount < 2) {
      throw new Error('Installment count must be an integer greater than 1');
    }
    if (installmentCount > 60) {
      throw new Error('Installment count cannot exceed 60 months');
    }
  }

  private validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Description cannot be empty');
    }
    if (description.trim().length > 200) {
      throw new Error('Description cannot exceed 200 characters');
    }
  }

  private validatePaymentMethodId(paymentMethodId: string): void {
    if (!paymentMethodId || paymentMethodId.trim().length === 0) {
      throw new Error('Payment method ID cannot be empty');
    }
  }

  private validateCategoryId(categoryId: string): void {
    if (!categoryId || categoryId.trim().length === 0) {
      throw new Error('Category ID cannot be empty');
    }
  }

  static create(
    id: string,
    totalAmount: Money,
    purchaseDate: Date,
    installmentCount: number,
    description: string,
    paymentMethodId: string,
    categoryId: string
  ): InstallmentPlan {
    return new InstallmentPlan(
      id,
      totalAmount,
      purchaseDate,
      installmentCount,
      description,
      paymentMethodId,
      categoryId
    );
  }
} 