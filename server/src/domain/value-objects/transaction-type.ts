export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export class TransactionTypeVO {
  private readonly _value: TransactionType;

  constructor(value: string) {
    const lowerValue = value.toLowerCase();
    if (!Object.values(TransactionType).includes(lowerValue as TransactionType)) {
      throw new Error(`Invalid transaction type: ${value}. Must be one of: ${Object.values(TransactionType).join(', ')}`);
    }
    this._value = lowerValue as TransactionType;
  }

  get value(): TransactionType {
    return this._value;
  }

  isIncome(): boolean {
    return this._value === TransactionType.INCOME;
  }

  isExpense(): boolean {
    return this._value === TransactionType.EXPENSE;
  }

  equals(other: TransactionTypeVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static income(): TransactionTypeVO {
    return new TransactionTypeVO(TransactionType.INCOME);
  }

  static expense(): TransactionTypeVO {
    return new TransactionTypeVO(TransactionType.EXPENSE);
  }
} 