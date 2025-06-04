import { Money } from '@/domain/value-objects/money.js';

export enum BucketTransferType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
}

export class BucketTransfer {
  private readonly _id: string;
  private readonly _date: Date;
  private readonly _amount: Money;
  private readonly _type: BucketTransferType;
  private readonly _bucketId: string;
  private _description: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    date: Date,
    amount: Money,
    type: BucketTransferType,
    bucketId: string,
    description: string | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.validateId(id);
    this.validateDate(date);
    this.validateAmount(amount);
    this.validateType(type);
    this.validateBucketId(bucketId);

    this._id = id;
    this._date = new Date(date);
    this._amount = amount;
    this._type = type;
    this._bucketId = bucketId;
    this._description = description?.trim() || null;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): string {
    return this._id;
  }

  get date(): Date {
    return new Date(this._date);
  }

  get amount(): Money {
    return this._amount;
  }

  get type(): BucketTransferType {
    return this._type;
  }

  get bucketId(): string {
    return this._bucketId;
  }

  get description(): string | null {
    return this._description;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  updateDescription(description: string | null): void {
    this._description = description?.trim() || null;
    this._updatedAt = new Date();
  }

  isDeposit(): boolean {
    return this._type === BucketTransferType.DEPOSIT;
  }

  isWithdrawal(): boolean {
    return this._type === BucketTransferType.WITHDRAWAL;
  }

  isInMonth(year: number, month: number): boolean {
    return this._date.getFullYear() === year && 
           this._date.getMonth() === month - 1; // Month is 0-indexed
  }

  isInYear(year: number): boolean {
    return this._date.getFullYear() === year;
  }

  isInDateRange(startDate: Date, endDate: Date): boolean {
    return this._date >= startDate && this._date <= endDate;
  }

  equals(other: BucketTransfer): boolean {
    return this._id === other._id;
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Transfer ID cannot be empty');
    }
  }

  private validateDate(date: Date): void {
    if (!date || isNaN(date.getTime())) {
      throw new Error('Invalid transfer date');
    }
    
    const now = new Date();
    const futureLimit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (date > futureLimit) {
      throw new Error('Transfer date cannot be more than 1 year in the future');
    }
  }

  private validateAmount(amount: Money): void {
    if (!amount) {
      throw new Error('Transfer amount is required');
    }
    
    if (amount.amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }
  }

  private validateType(type: BucketTransferType): void {
    if (!Object.values(BucketTransferType).includes(type)) {
      throw new Error(`Invalid transfer type: ${type}`);
    }
  }

  private validateBucketId(bucketId: string): void {
    if (!bucketId || bucketId.trim().length === 0) {
      throw new Error('Bucket ID cannot be empty');
    }
  }

  static createDeposit(
    id: string,
    date: Date,
    amount: Money,
    bucketId: string,
    description?: string
  ): BucketTransfer {
    return new BucketTransfer(
      id,
      date,
      amount,
      BucketTransferType.DEPOSIT,
      bucketId,
      description
    );
  }

  static createWithdrawal(
    id: string,
    date: Date,
    amount: Money,
    bucketId: string,
    description?: string
  ): BucketTransfer {
    return new BucketTransfer(
      id,
      date,
      amount,
      BucketTransferType.WITHDRAWAL,
      bucketId,
      description
    );
  }
} 