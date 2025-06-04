import { describe, it, expect } from 'vitest';
import { Money } from '@/domain/value-objects/money.js';

describe('Money Value Object', () => {
  describe('constructor', () => {
    it('should create a money instance with valid amount and currency', () => {
      const money = new Money(100.50, 'USD');
      
      expect(money.amount).toBe(100.50);
      expect(money.currency).toBe('USD');
    });

    it('should default to BRL currency when not specified', () => {
      const money = new Money(50);
      
      expect(money.currency).toBe('BRL');
    });

    it('should convert currency to uppercase', () => {
      const money = new Money(100, 'usd');
      
      expect(money.currency).toBe('USD');
    });

    it('should round amount to 2 decimal places', () => {
      const money = new Money(100.123);
      
      expect(money.amount).toBe(100.12);
    });

    it('should throw error for negative amounts', () => {
      expect(() => new Money(-10)).toThrow('Amount cannot be negative');
    });

    it('should throw error for empty currency', () => {
      expect(() => new Money(100, '')).toThrow('Currency cannot be empty');
      expect(() => new Money(100, '   ')).toThrow('Currency cannot be empty');
    });
  });

  describe('arithmetic operations', () => {
    it('should add two money amounts with same currency', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'USD');
      const result = money1.add(money2);
      
      expect(result.amount).toBe(150);
      expect(result.currency).toBe('USD');
    });

    it('should subtract two money amounts with same currency', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(30, 'USD');
      const result = money1.subtract(money2);
      
      expect(result.amount).toBe(70);
      expect(result.currency).toBe('USD');
    });

    it('should multiply money by a factor', () => {
      const money = new Money(50, 'USD');
      const result = money.multiply(2);
      
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('USD');
    });

    it('should divide money by a divisor', () => {
      const money = new Money(100, 'USD');
      const result = money.divide(4);
      
      expect(result.amount).toBe(25);
      expect(result.currency).toBe('USD');
    });

    it('should throw error when adding different currencies', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'EUR');
      
      expect(() => money1.add(money2)).toThrow('Cannot operate on different currencies: USD and EUR');
    });

    it('should throw error when subtraction results in negative amount', () => {
      const money1 = new Money(50, 'USD');
      const money2 = new Money(100, 'USD');
      
      expect(() => money1.subtract(money2)).toThrow('Subtraction result cannot be negative');
    });

    it('should throw error when multiplying by negative factor', () => {
      const money = new Money(100, 'USD');
      
      expect(() => money.multiply(-2)).toThrow('Factor cannot be negative');
    });

    it('should throw error when dividing by zero or negative number', () => {
      const money = new Money(100, 'USD');
      
      expect(() => money.divide(0)).toThrow('Divisor must be positive');
      expect(() => money.divide(-5)).toThrow('Divisor must be positive');
    });
  });

  describe('comparison operations', () => {
    it('should check equality correctly', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(100, 'USD');
      const money3 = new Money(50, 'USD');
      const money4 = new Money(100, 'EUR');
      
      expect(money1.equals(money2)).toBe(true);
      expect(money1.equals(money3)).toBe(false);
      expect(money1.equals(money4)).toBe(false);
    });

    it('should compare amounts correctly', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'USD');
      const money3 = new Money(150, 'USD');
      
      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money1.isLessThan(money3)).toBe(true);
      expect(money1.isGreaterThan(money3)).toBe(false);
      expect(money1.isLessThan(money2)).toBe(false);
    });

    it('should throw error when comparing different currencies', () => {
      const money1 = new Money(100, 'USD');
      const money2 = new Money(50, 'EUR');
      
      expect(() => money1.isGreaterThan(money2)).toThrow('Cannot operate on different currencies: USD and EUR');
      expect(() => money1.isLessThan(money2)).toThrow('Cannot operate on different currencies: USD and EUR');
    });
  });

  describe('static factory methods', () => {
    it('should create zero money', () => {
      const zero = Money.zero();
      
      expect(zero.amount).toBe(0);
      expect(zero.currency).toBe('BRL');
    });

    it('should create zero money with specified currency', () => {
      const zero = Money.zero('USD');
      
      expect(zero.amount).toBe(0);
      expect(zero.currency).toBe('USD');
    });

    it('should create money from cents', () => {
      const money = Money.fromCents(12345);
      
      expect(money.amount).toBe(123.45);
      expect(money.currency).toBe('BRL');
    });

    it('should create money from cents with specified currency', () => {
      const money = Money.fromCents(5000, 'USD');
      
      expect(money.amount).toBe(50);
      expect(money.currency).toBe('USD');
    });
  });

  describe('toString', () => {
    it('should format money as string correctly', () => {
      const money = new Money(123.45, 'USD');
      
      expect(money.toString()).toBe('USD 123.45');
    });
  });
}); 