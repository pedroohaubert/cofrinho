export enum PaymentMethodType {
  CASH = 'cash',
  BANK = 'bank',
  CREDIT_CARD = 'credit_card',
}

export class PaymentMethod {
  private readonly _id: string;
  private _name: string;
  private readonly _type: PaymentMethodType;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    name: string,
    type: PaymentMethodType,
    isActive: boolean = true,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.validateId(id);
    this.validateName(name);
    this.validateType(type);

    this._id = id;
    this._name = name.trim();
    this._type = type;
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

  get type(): PaymentMethodType {
    return this._type;
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

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  isCash(): boolean {
    return this._type === PaymentMethodType.CASH;
  }

  isBank(): boolean {
    return this._type === PaymentMethodType.BANK;
  }

  isCreditCard(): boolean {
    return this._type === PaymentMethodType.CREDIT_CARD;
  }

  supportsInstallments(): boolean {
    return this._type === PaymentMethodType.CREDIT_CARD;
  }

  equals(other: PaymentMethod): boolean {
    return this._id === other._id;
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('Payment method ID cannot be empty');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Payment method name cannot be empty');
    }
    if (name.trim().length > 50) {
      throw new Error('Payment method name cannot exceed 50 characters');
    }
  }

  private validateType(type: PaymentMethodType): void {
    if (!Object.values(PaymentMethodType).includes(type)) {
      throw new Error(`Invalid payment method type: ${type}`);
    }
  }

  static create(
    id: string,
    name: string,
    type: PaymentMethodType
  ): PaymentMethod {
    return new PaymentMethod(id, name, type);
  }

  static createCash(id: string, name: string = 'Cash'): PaymentMethod {
    return new PaymentMethod(id, name, PaymentMethodType.CASH);
  }

  static createBank(id: string, name: string): PaymentMethod {
    return new PaymentMethod(id, name, PaymentMethodType.BANK);
  }

  static createCreditCard(id: string, name: string): PaymentMethod {
    return new PaymentMethod(id, name, PaymentMethodType.CREDIT_CARD);
  }
} 