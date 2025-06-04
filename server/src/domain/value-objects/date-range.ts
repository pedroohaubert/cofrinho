export class DateRange {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }
    
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    this._startDate = new Date(startDate);
    this._endDate = new Date(endDate);
  }

  get startDate(): Date {
    return new Date(this._startDate);
  }

  get endDate(): Date {
    return new Date(this._endDate);
  }

  contains(date: Date): boolean {
    return date >= this._startDate && date <= this._endDate;
  }

  getDurationInDays(): number {
    const timeDiff = this._endDate.getTime() - this._startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  overlaps(other: DateRange): boolean {
    return this._startDate <= other._endDate && this._endDate >= other._startDate;
  }

  equals(other: DateRange): boolean {
    return this._startDate.getTime() === other._startDate.getTime() &&
           this._endDate.getTime() === other._endDate.getTime();
  }

  toString(): string {
    return `${this._startDate.toISOString().split('T')[0]} to ${this._endDate.toISOString().split('T')[0]}`;
  }

  static monthlyRange(year: number, month: number): DateRange {
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    
    return new DateRange(startDate, endDate);
  }

  static yearlyRange(year: number): DateRange {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    return new DateRange(startDate, endDate);
  }

  static customRange(startDate: string, endDate: string): DateRange {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date string provided for custom range');
    }

    return new DateRange(start, end);
  }
} 