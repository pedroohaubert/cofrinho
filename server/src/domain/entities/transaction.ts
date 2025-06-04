import { Money } from '../value-objects/money.js';
import { TransactionType } from '../value-objects/transaction-type.js';

export enum TransactionSource {
  MANUAL = 'manual',
  INSTALLMENT = 'installment',
  SUBSCRIPTION = 'subscription',
}

export class Transaction {
  private readonly _id: string;
  private _date: Date;
  private _amount: Money;
  private _categoryId: string;
  private _paymentMethodId: string;
  private _description: string | null;
  private readonly _type: TransactionType;
  private readonly _source: TransactionSource;
  private readonly _sourceId: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    date: Date,
    amount: Money,
    categoryId: string,
    paymentMethodId: string,
    type: TransactionType,
    description: string | null = null,
    source: TransactionSource = TransactionSource.MANUAL,
    sourceId: string | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.validateId(id);
    this.validateDate(date);
    this.validateAmount(amount, type);
    this.validateCategoryId(categoryId);
    this.validatePaymentMethodId(paymentMethodId);
    this.validateSourceRelation(source, sourceId);

    this._id = id;
    this._date = new Date(date);
    this._amount = amount;
    this._categoryId = categoryId;
    this._paymentMethodId = paymentMethodId;
    this._type = type;
    this._description = description?.trim() || null;
    this._source = source;
    this._sourceId = sourceId;
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

  get categoryId(): string {
    return this._categoryId;
  }

  get paymentMethodId(): string {
    return this._paymentMethodId;
  }

  get description(): string | null {
    return this._description;
  }

  get type(): TransactionType {
    return this._type;
  }

  get source(): TransactionSource {
    return this._source;
  }

  get sourceId(): string | null {
    return this._sourceId;
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  updateDate(date: Date): void {
    this.validateDate(date);
    this._date = new Date(date);
    this._updatedAt = new Date();
  }

  updateAmount(amount: Money): void {
    this.validateAmount(amount, this._type);
    this._amount = amount;
    this._updatedAt = new Date();
  }

  updateCategory(categoryId: string): void {
    this.validateCategoryId(categoryId);
    this._categoryId = categoryId;
    this._updatedAt = new Date();
  }

  updatePaymentMethod(paymentMethodId: string): void {
    this.validatePaymentMethodId(paymentMethodId);
    this._paymentMethodId = paymentMethodId;
    this._updatedAt = new Date();
  }

  updateDescription(description: string | null): void {
    this._description = description?.trim() || null;
    this._updatedAt = new Date();
  }

  isIncome(): boolean {
    return this._type === TransactionType.INCOME;
  }

  isExpense(): boolean {
    return this._type === TransactionType.EXPENSE;
  }

  isManual(): boolean {
    return this._source === TransactionSource.MANUAL;
  }

  isFromInstallment(): boolean {
    return this._source === TransactionSource.INSTALLMENT;
  }

  isFromSubscription(): boolean {
    return this._source === TransactionSource.SUBSCRIPTION;
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

  equals(other: Transaction): boolean {
    return this._id === other._id;
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Transaction ID cannot be empty');
    }
  }

  private validateDate(date: Date): void {
    if (!date || isNaN(date.getTime())) {
      throw new Error('Invalid transaction date');
    }
    
    const now = new Date();
    const futureLimit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    if (date > futureLimit) {
      throw new Error('Transaction date cannot be more than 1 year in the future');
    }
  }

  private validateAmount(amount: Money, type: TransactionType): void {
    if (!amount) {
      throw new Error('Transaction amount is required');
    }
    
    if (amount.amount <= 0) {
      throw new Error('Transaction amount must be positive');
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

  private validateSourceRelation(source: TransactionSource, sourceId: string | null): void {
    if (source === TransactionSource.MANUAL && sourceId !== null) {
      throw new Error('Manual transactions cannot have a source ID');
    }
    
    if ((source === TransactionSource.INSTALLMENT || source === TransactionSource.SUBSCRIPTION) && !sourceId) {
      throw new Error(`${source} transactions must have a source ID`);
    }
  }

  static createManual(
    id: string,
    date: Date,
    amount: Money,
    categoryId: string,
    paymentMethodId: string,
    type: TransactionType,
    description?: string
  ): Transaction {
    return new Transaction(
      id,
      date,
      amount,
      categoryId,
      paymentMethodId,
      type,
      description,
      TransactionSource.MANUAL,
      null
    );
  }

  static createFromInstallment(
    id: string,
    date: Date,
    amount: Money,
    categoryId: string,
    paymentMethodId: string,
    type: TransactionType,
    installmentPlanId: string,
    description?: string
  ): Transaction {
    return new Transaction(
      id,
      date,
      amount,
      categoryId,
      paymentMethodId,
      type,
      description,
      TransactionSource.INSTALLMENT,
      installmentPlanId
    );
  }

  static createFromSubscription(
    id: string,
    date: Date,
    amount: Money,
    categoryId: string,
    paymentMethodId: string,
    type: TransactionType,
    subscriptionId: string,
    description?: string
  ): Transaction {
    return new Transaction(
      id,
      date,
      amount,
      categoryId,
      paymentMethodId,
      type,
      description,
      TransactionSource.SUBSCRIPTION,
      subscriptionId
    );
  }
} 