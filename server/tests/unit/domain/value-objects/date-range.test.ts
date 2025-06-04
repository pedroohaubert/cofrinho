import { describe, it, expect } from 'vitest';
import { DateRange } from '@/domain/value-objects/date-range.js';

describe('DateRange Value Object', () => {
  describe('constructor', () => {
    it('should create a date range with valid start and end dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const range = new DateRange(startDate, endDate);
      
      expect(range.startDate).toEqual(startDate);
      expect(range.endDate).toEqual(endDate);
    });

    it('should throw error when start date is after end date', () => {
      const startDate = new Date('2024-01-31');
      const endDate = new Date('2024-01-01');
      
      expect(() => new DateRange(startDate, endDate))
        .toThrow('Start date cannot be after end date');
    });

    it('should allow start date equal to end date', () => {
      const date = new Date('2024-01-01');
      const range = new DateRange(date, date);
      
      expect(range.startDate).toEqual(date);
      expect(range.endDate).toEqual(date);
    });
  });

  describe('contains', () => {
    it('should return true when date is within range', () => {
      const range = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      const testDate = new Date('2024-01-15');
      
      expect(range.contains(testDate)).toBe(true);
    });

    it('should return true when date equals start date', () => {
      const startDate = new Date('2024-01-01');
      const range = new DateRange(startDate, new Date('2024-01-31'));
      
      expect(range.contains(startDate)).toBe(true);
    });

    it('should return true when date equals end date', () => {
      const endDate = new Date('2024-01-31');
      const range = new DateRange(new Date('2024-01-01'), endDate);
      
      expect(range.contains(endDate)).toBe(true);
    });

    it('should return false when date is before range', () => {
      const range = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      const testDate = new Date('2023-12-31');
      
      expect(range.contains(testDate)).toBe(false);
    });

    it('should return false when date is after range', () => {
      const range = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      const testDate = new Date('2024-02-01');
      
      expect(range.contains(testDate)).toBe(false);
    });
  });

  describe('getDurationInDays', () => {
    it('should calculate duration correctly for same date', () => {
      const date = new Date('2024-01-01');
      const range = new DateRange(date, date);
      
      expect(range.getDurationInDays()).toBe(0);
    });

    it('should calculate duration correctly for one day apart', () => {
      const range = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );
      
      expect(range.getDurationInDays()).toBe(1);
    });

    it('should calculate duration correctly for January month', () => {
      const range = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      
      expect(range.getDurationInDays()).toBe(30);
    });

    it('should calculate duration correctly for leap year February', () => {
      const range = new DateRange(
        new Date('2024-02-01'),
        new Date('2024-02-29')
      );
      
      expect(range.getDurationInDays()).toBe(28);
    });
  });

  describe('overlaps', () => {
    it('should return true when ranges overlap', () => {
      const range1 = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-15')
      );
      const range2 = new DateRange(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );
      
      expect(range1.overlaps(range2)).toBe(true);
    });

    it('should return true when ranges touch at boundary', () => {
      const range1 = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-15')
      );
      const range2 = new DateRange(
        new Date('2024-01-15'),
        new Date('2024-01-20')
      );
      
      expect(range1.overlaps(range2)).toBe(true);
    });

    it('should return false when ranges do not overlap', () => {
      const range1 = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-15')
      );
      const range2 = new DateRange(
        new Date('2024-01-16'),
        new Date('2024-01-20')
      );
      
      expect(range1.overlaps(range2)).toBe(false);
    });

    it('should return true when one range contains another', () => {
      const range1 = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      const range2 = new DateRange(
        new Date('2024-01-10'),
        new Date('2024-01-20')
      );
      
      expect(range1.overlaps(range2)).toBe(true);
      expect(range2.overlaps(range1)).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for identical ranges', () => {
      const range1 = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      const range2 = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      
      expect(range1.equals(range2)).toBe(true);
    });

    it('should return false for different ranges', () => {
      const range1 = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      const range2 = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-30')
      );
      
      expect(range1.equals(range2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should format date range correctly', () => {
      const range = new DateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      
      const result = range.toString();
      expect(result).toContain('2024-01-01');
      expect(result).toContain('2024-01-31');
      expect(result).toContain(' to ');
    });
  });

  describe('static factory methods', () => {
    describe('monthlyRange', () => {
      it('should create correct range for January 2024', () => {
        const range = DateRange.monthlyRange(2024, 1);
        
        expect(range.startDate).toEqual(new Date('2024-01-01'));
        expect(range.endDate).toEqual(new Date('2024-01-31'));
      });

      it('should create correct range for February 2024 (leap year)', () => {
        const range = DateRange.monthlyRange(2024, 2);
        
        expect(range.startDate).toEqual(new Date('2024-02-01'));
        expect(range.endDate).toEqual(new Date('2024-02-29'));
      });

      it('should create correct range for February 2023 (non-leap year)', () => {
        const range = DateRange.monthlyRange(2023, 2);
        
        expect(range.startDate).toEqual(new Date('2023-02-01'));
        expect(range.endDate).toEqual(new Date('2023-02-28'));
      });

      it('should throw error for invalid month', () => {
        expect(() => DateRange.monthlyRange(2024, 0))
          .toThrow('Month must be between 1 and 12');
        expect(() => DateRange.monthlyRange(2024, 13))
          .toThrow('Month must be between 1 and 12');
      });
    });

    describe('yearlyRange', () => {
      it('should create correct range for 2024', () => {
        const range = DateRange.yearlyRange(2024);
        
        expect(range.startDate).toEqual(new Date('2024-01-01'));
        expect(range.endDate).toEqual(new Date('2024-12-31'));
      });

      it('should create correct range for 2023', () => {
        const range = DateRange.yearlyRange(2023);
        
        expect(range.startDate).toEqual(new Date('2023-01-01'));
        expect(range.endDate).toEqual(new Date('2023-12-31'));
      });
    });

    describe('customRange', () => {
      it('should create range from string dates', () => {
        const range = DateRange.customRange('2024-01-01', '2024-01-31');
        
        expect(range.startDate).toEqual(new Date('2024-01-01'));
        expect(range.endDate).toEqual(new Date('2024-01-31'));
      });

      it('should throw error for invalid date strings', () => {
        expect(() => DateRange.customRange('invalid', '2024-01-31'))
          .toThrow();
        expect(() => DateRange.customRange('2024-01-01', 'invalid'))
          .toThrow();
      });
    });
  });
}); 