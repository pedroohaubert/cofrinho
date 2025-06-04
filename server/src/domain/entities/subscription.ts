import { Money } from '../value-objects/money.js';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

export class Subscription {
  private readonly _id: string;
  private _name: string;
  private readonly _monthlyAmount: Money;
  private readonly _startDate: Date;
  private _endDate: Date | null;
  private readonly _categoryId: string;
  private readonly _paymentMethodId: string;
  private _status: SubscriptionStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    name: string,
    monthlyAmount: Money,
    startDate: Date,
    categoryId: string,
    paymentMethodId: string,
    endDate: Date | null = null,
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.validateId(id);
    this.validateName(name);
    this.validateMonthlyAmount(monthlyAmount);
    this.validateStartDate(startDate);
    this.validateCategoryId(categoryId);
    this.validatePaymentMethodId(paymentMethodId);
    this.validateEndDate(startDate, endDate);

    this._id = id;
    this._name = name.trim();
    this._monthlyAmount = monthlyAmount;
    this._startDate = new Date(startDate);
    this._endDate = endDate ? new Date(endDate) : null;
    this._categoryId = categoryId;
    this._paymentMethodId = paymentMethodId;
    this._status = status;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get monthlyAmount(): Money {
    return this._monthlyAmount;
  }

  get startDate(): Date {
    return new Date(this._startDate);
  }

  get endDate(): Date | null {
    return this._endDate ? new Date(this._endDate) : null;
  }

  get categoryId(): string {
    return this._categoryId;
  }

  get paymentMethodId(): string {
    return this._paymentMethodId;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  updateName(name: string): void {
    this.validateName(name);
    this._name = name.trim();
    this._updatedAt = new Date();
  }

  cancel(endDate?: Date): void {
    if (this._status === SubscriptionStatus.CANCELLED) {
      throw new Error('Subscription is already cancelled');
    }

    const cancelDate = endDate || new Date();
    this.validateEndDate(this._startDate, cancelDate);
    
    this._endDate = cancelDate;
    this._status = SubscriptionStatus.CANCELLED;
    this._updatedAt = new Date();
  }

  pause(): void {
    if (this._status === SubscriptionStatus.CANCELLED) {
      throw new Error('Cannot pause a cancelled subscription');
    }
    if (this._status === SubscriptionStatus.PAUSED) {
      throw new Error('Subscription is already paused');
    }
    
    this._status = SubscriptionStatus.PAUSED;
    this._updatedAt = new Date();
  }

  resume(): void {
    if (this._status === SubscriptionStatus.CANCELLED) {
      throw new Error('Cannot resume a cancelled subscription');
    }
    if (this._status === SubscriptionStatus.ACTIVE) {
      throw new Error('Subscription is already active');
    }
    
    this._status = SubscriptionStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  isActive(): boolean {
    return this._status === SubscriptionStatus.ACTIVE;
  }

  isCancelled(): boolean {
    return this._status === SubscriptionStatus.CANCELLED;
  }

  isPaused(): boolean {
    return this._status === SubscriptionStatus.PAUSED;
  }

  isActiveOnDate(date: Date): boolean {
    if (!this.isActive()) {
      return false;
    }

    if (date < this._startDate) {
      return false;
    }

    if (this._endDate && date > this._endDate) {
      return false;
    }

    return true;
  }

  calculateTotalAmount(fromDate: Date, toDate: Date): Money {
    if (fromDate > toDate) {
      throw new Error('From date cannot be after to date');
    }

    let totalMonths = 0;
    const currentDate = new Date(fromDate);
    
    while (currentDate <= toDate) {
      if (this.isActiveOnDate(currentDate)) {
        totalMonths++;
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return this._monthlyAmount.multiply(totalMonths);
  }

  getNextPaymentDate(fromDate: Date = new Date()): Date | null {
    if (!this.isActive()) {
      return null;
    }

    const nextPayment = new Date(fromDate);
    nextPayment.setDate(this._startDate.getDate());
    
    // If we're past this month's payment date, move to next month
    if (nextPayment <= fromDate) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }

    // Check if the next payment would be after the end date
    if (this._endDate && nextPayment > this._endDate) {
      return null;
    }

    return nextPayment;
  }

  shouldGeneratePaymentForMonth(year: number, month: number): boolean {
    if (!this.isActive()) {
      return false;
    }

    const monthDate = new Date(year, month - 1, this._startDate.getDate());
    return this.isActiveOnDate(monthDate);
  }

  equals(other: Subscription): boolean {
    return this._id === other._id;
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Subscription ID cannot be empty');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Subscription name cannot be empty');
    }
    if (name.trim().length > 100) {
      throw new Error('Subscription name cannot exceed 100 characters');
    }
  }

  private validateMonthlyAmount(monthlyAmount: Money): void {
    if (!monthlyAmount) {
      throw new Error('Monthly amount is required');
    }
    if (monthlyAmount.amount <= 0) {
      throw new Error('Monthly amount must be positive');
    }
  }

  private validateStartDate(startDate: Date): void {
    if (!startDate || isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }
  }

  private validateEndDate(startDate: Date, endDate: Date | null): void {
    if (endDate && endDate <= startDate) {
      throw new Error('End date must be after start date');
    }
  }

  private validateCategoryId(categoryId: string): void {
    if (!categoryId || categoryId.trim().length === 0) {
      throw new Error('Category ID cannot be empty');
    }
  }

  private validatePaymentMethodId(paymentMethodId: string): void {
    if (!paymentMethodId || paymentMethodId.trim().length === 0) {
      throw new Error('Payment method ID cannot be empty');
    }
  }

  static create(
    id: string,
    name: string,
    monthlyAmount: Money,
    startDate: Date,
    categoryId: string,
    paymentMethodId: string
  ): Subscription {
    return new Subscription(
      id,
      name,
      monthlyAmount,
      startDate,
      categoryId,
      paymentMethodId
    );
  }
} 