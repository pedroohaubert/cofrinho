import { Money } from '../value-objects/money.js';

export class SavingsBucket {
  private readonly _id: string;
  private _name: string;
  private _targetAmount: Money | null;
  private _currentBalance: Money;
  private _description: string | null;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    name: string,
    targetAmount: Money | null = null,
    currentBalance: Money | null = null,
    description: string | null = null,
    isActive: boolean = true,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.validateId(id);
    this.validateName(name);
    this.validateTargetAmount(targetAmount);
    this.validateCurrentBalance(currentBalance);

    this._id = id;
    this._name = name.trim();
    this._targetAmount = targetAmount;
    this._currentBalance = currentBalance || Money.zero();
    this._description = description?.trim() || null;
    this._isActive = isActive;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get targetAmount(): Money | null {
    return this._targetAmount;
  }

  get currentBalance(): Money {
    return this._currentBalance;
  }

  get description(): string | null {
    return this._description;
  }

  get isActive(): boolean {
    return this._isActive;
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

  updateTargetAmount(targetAmount: Money | null): void {
    this.validateTargetAmount(targetAmount);
    this._targetAmount = targetAmount;
    this._updatedAt = new Date();
  }

  updateDescription(description: string | null): void {
    this._description = description?.trim() || null;
    this._updatedAt = new Date();
  }

  addFunds(amount: Money): void {
    this.validateTransferAmount(amount);
    this._currentBalance = this._currentBalance.add(amount);
    this._updatedAt = new Date();
  }

  withdrawFunds(amount: Money): void {
    this.validateTransferAmount(amount);
    
    if (this._currentBalance.isLessThan(amount)) {
      throw new Error('Insufficient funds in bucket');
    }
    
    this._currentBalance = this._currentBalance.subtract(amount);
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  hasTarget(): boolean {
    return this._targetAmount !== null;
  }

  isTargetReached(): boolean {
    if (!this.hasTarget()) {
      return false;
    }
    
    return this._currentBalance.isGreaterThan(this._targetAmount!) || 
           this._currentBalance.equals(this._targetAmount!);
  }

  getProgressPercentage(): number | null {
    if (!this.hasTarget()) {
      return null;
    }
    
    if (this._targetAmount!.amount === 0) {
      // If target is 0, and balance is 0, progress is 100%.
      // If balance > 0, progress is infinitely more than target.
      return this._currentBalance.amount === 0 ? 100 : Infinity;
    }
    
    const progress = (this._currentBalance.amount / this._targetAmount!.amount) * 100;
    return progress;
  }

  getRemainingAmount(): Money | null {
    if (!this.hasTarget()) {
      return null;
    }
    
    if (this.isTargetReached()) {
      return Money.zero(this._targetAmount!.currency);
    }
    
    return this._targetAmount!.subtract(this._currentBalance);
  }

  canWithdraw(amount: Money): boolean {
    try {
      this.validateTransferAmount(amount);
      return this._currentBalance.isGreaterThan(amount) || 
             this._currentBalance.equals(amount);
    } catch {
      return false;
    }
  }

  isEmpty(): boolean {
    return this._currentBalance.amount === 0;
  }

  equals(other: SavingsBucket): boolean {
    return this._id === other._id;
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Bucket ID cannot be empty');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Bucket name cannot be empty');
    }
    if (name.trim().length > 100) {
      throw new Error('Bucket name cannot exceed 100 characters');
    }
  }

  private validateTargetAmount(targetAmount: Money | null): void {
    if (targetAmount && targetAmount.amount < 0) {
      throw new Error('Target amount cannot be negative');
    }
    if (targetAmount && targetAmount.amount === 0) {
      throw new Error('Target amount cannot be zero');
    }
  }

  private validateCurrentBalance(currentBalance: Money | null): void {
    if (currentBalance && currentBalance.amount < 0) {
      throw new Error('Current balance cannot be negative');
    }
  }

  private validateTransferAmount(amount: Money): void {
    if (!amount) {
      throw new Error('Transfer amount is required');
    }
    if (amount.amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }
    
    // Validate currency compatibility
    if (this._currentBalance.currency !== amount.currency) {
      throw new Error(`Currency mismatch: bucket uses ${this._currentBalance.currency}, transfer uses ${amount.currency}`);
    }
  }

  static create(
    id: string,
    name: string,
    targetAmount?: Money,
    description?: string
  ): SavingsBucket {
    return new SavingsBucket(id, name, targetAmount || null, null, description || null);
  }

  static createWithInitialBalance(
    id: string,
    name: string,
    initialBalance: Money,
    targetAmount?: Money,
    description?: string
  ): SavingsBucket {
    return new SavingsBucket(
      id, 
      name, 
      targetAmount || null, 
      initialBalance, 
      description || null
    );
  }
} 