import { TransactionType } from '@/domain/value-objects/transaction-type.js';

export class Category {
  private readonly _id: string;
  private _name: string;
  private _type: TransactionType;
  private _color: string | null;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    name: string,
    type: TransactionType,
    color: string | null = null,
    isActive: boolean = true,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.validateName(name);
    this.validateId(id);
    
    this._id = id;
    this._name = name.trim();
    this._type = type;
    this._color = color?.trim() || null;
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

  get type(): TransactionType {
    return this._type;
  }

  get color(): string | null {
    return this._color;
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

  updateColor(color: string | null): void {
    this._color = color?.trim() || null;
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

  isForIncomeTransactions(): boolean {
    return this._type === TransactionType.INCOME;
  }

  isForExpenseTransactions(): boolean {
    return this._type === TransactionType.EXPENSE;
  }

  canBeUsedForTransactionType(transactionType: TransactionType): boolean {
    return this._type === transactionType;
  }

  equals(other: Category): boolean {
    return this._id === other._id;
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    if (name.trim().length > 100) {
      throw new Error('Category name cannot exceed 100 characters');
    }
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Category ID cannot be empty');
    }
  }

  static create(
    id: string,
    name: string,
    type: TransactionType,
    color?: string
  ): Category {
    return new Category(id, name, type, color);
  }
} 