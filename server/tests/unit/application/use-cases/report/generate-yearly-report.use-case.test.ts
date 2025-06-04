import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateYearlyReportUseCase } from '@/application/use-cases/report/generate-yearly-report.use-case.js';
import { ReportingService, YearlyReport } from '@/domain/services/reporting-service.js';
import { DateRange } from '@/domain/value-objects/date-range.js';
import { Money } from '@/domain/value-objects/money.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { GenerateYearlyReportDTO } from '@/application/dto/report.dto.js';

describe('GenerateYearlyReportUseCase', () => {
  let useCase: GenerateYearlyReportUseCase;
  let mockReportingService: vi.Mocked<ReportingService>;

  beforeEach(() => {
    // Setup mock reporting service
    mockReportingService = {
      generateMonthlyReport: vi.fn(),
      generateYearlyReport: vi.fn(),
      generateCategoryBreakdown: vi.fn(),
      generatePaymentMethodBreakdown: vi.fn(),
      calculateDailyTrends: vi.fn(),
      calculateYearlyTrends: vi.fn(),
    } as any;

    useCase = new GenerateYearlyReportUseCase(mockReportingService);
  });

  describe('execute', () => {
    const validReportDTO: GenerateYearlyReportDTO = {
      year: 2024,
    };

    const mockYearlyReport: YearlyReport = {
      year: 2024,
      period: DateRange.yearlyRange(2024),
      summary: {
        totalIncome: new Money(60000, 'BRL'),
        totalExpense: new Money(42000, 'BRL'),
        net: new Money(18000, 'BRL'),
        avgMonthlyIncome: new Money(5000, 'BRL'),
        avgMonthlyExpense: new Money(3500, 'BRL'),
        transactionCount: 540,
        monthsWithData: 12,
      },
      monthlyBreakdown: [
        {
          month: 1,
          year: 2024,
          totalIncome: new Money(5000, 'BRL'),
          totalExpense: new Money(3500, 'BRL'),
          net: new Money(1500, 'BRL'),
        },
        {
          month: 2,
          year: 2024,
          totalIncome: new Money(5000, 'BRL'),
          totalExpense: new Money(3000, 'BRL'),
          net: new Money(2000, 'BRL'),
        },
      ],
      categoryBreakdown: [
        {
          categoryId: 'cat-salary',
          categoryName: 'Salary',
          type: TransactionType.INCOME,
          totalAmount: new Money(60000, 'BRL'),
          transactionCount: 12,
          averageAmount: new Money(5000, 'BRL'),
          percentage: 100,
        },
        {
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          type: TransactionType.EXPENSE,
          totalAmount: new Money(24000, 'BRL'),
          transactionCount: 240,
          averageAmount: new Money(100, 'BRL'),
          percentage: 57.14,
        },
      ],
      trends: {
        incomeGrowth: 5.2,
        expenseGrowth: 3.8,
        bestMonth: {
          month: 2,
          net: new Money(2000, 'BRL'),
        },
        worstMonth: {
          month: 12,
          net: new Money(1000, 'BRL'),
        },
      },
    };

    describe('successful report generation', () => {
      it('should generate yearly report successfully', async () => {
        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(mockYearlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report).toBeDefined();
        expect(result.report?.year).toBe(2024);
        expect(result.report?.summary.totalIncome).toBe(60000);
        expect(result.report?.summary.totalExpense).toBe(42000);
        expect(result.report?.summary.net).toBe(18000);
        expect(result.report?.summary.currency).toBe('BRL');
        expect(result.report?.summary.avgMonthlyIncome).toBe(5000);
        expect(result.report?.summary.avgMonthlyExpense).toBe(3500);
        expect(result.report?.summary.transactionCount).toBe(540);
        expect(result.report?.summary.monthsWithData).toBe(12);
        expect(result.errors).toBeUndefined();

        // Verify service call
        expect(mockReportingService.generateYearlyReport).toHaveBeenCalledWith(2024);
      });

      it('should generate report for different years', async () => {
        const previousYearReport: GenerateYearlyReportDTO = {
          year: 2023,
        };

        const previousYearMockReport: YearlyReport = {
          ...mockYearlyReport,
          year: 2023,
          period: DateRange.yearlyRange(2023),
        };

        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(previousYearMockReport);

        // Execute
        const result = await useCase.execute(previousYearReport);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.year).toBe(2023);
        expect(mockReportingService.generateYearlyReport).toHaveBeenCalledWith(2023);
      });

      it('should handle reports with no transactions', async () => {
        const emptyReport: YearlyReport = {
          year: 2024,
          period: DateRange.yearlyRange(2024),
          summary: {
            totalIncome: Money.zero('BRL'),
            totalExpense: Money.zero('BRL'),
            net: Money.zero('BRL'),
            avgMonthlyIncome: Money.zero('BRL'),
            avgMonthlyExpense: Money.zero('BRL'),
            transactionCount: 0,
            monthsWithData: 0,
          },
          monthlyBreakdown: [],
          categoryBreakdown: [],
          trends: {
            incomeGrowth: 0,
            expenseGrowth: 0,
            bestMonth: {
              month: 1,
              net: Money.zero('BRL'),
            },
            worstMonth: {
              month: 1,
              net: Money.zero('BRL'),
            },
          },
        };

        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(emptyReport);

        // Execute
        const result = await useCase.execute({ year: 2024 });

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.summary.totalIncome).toBe(0);
        expect(result.report?.summary.totalExpense).toBe(0);
        expect(result.report?.summary.net).toBe(0);
        expect(result.report?.summary.transactionCount).toBe(0);
        expect(result.report?.summary.monthsWithData).toBe(0);
        expect(result.report?.monthlyBreakdown).toHaveLength(0);
        expect(result.report?.categoryBreakdown).toHaveLength(0);
      });

      it('should handle current year report generation', async () => {
        const currentYear = new Date().getFullYear();

        const currentYearReport: GenerateYearlyReportDTO = {
          year: currentYear,
        };

        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(mockYearlyReport);

        // Execute
        const result = await useCase.execute(currentYearReport);

        // Verify
        expect(result.success).toBe(true);
        expect(mockReportingService.generateYearlyReport).toHaveBeenCalledWith(currentYear);
      });
    });

    describe('year validation', () => {
      it('should fail with invalid year (too old)', async () => {
        const invalidYearReport: GenerateYearlyReportDTO = {
          year: 1999,
        };

        // Execute
        const result = await useCase.execute(invalidYearReport);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Year must be between 2000 and current year');
        expect(result.report).toBeUndefined();
        expect(mockReportingService.generateYearlyReport).not.toHaveBeenCalled();
      });

      it('should fail with future year', async () => {
        const futureYear = new Date().getFullYear() + 1;
        const futureYearReport: GenerateYearlyReportDTO = {
          year: futureYear,
        };

        // Execute
        const result = await useCase.execute(futureYearReport);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Year must be between 2000 and current year');
        expect(result.errors).toContain('Cannot generate report for future years');
        expect(result.report).toBeUndefined();
        expect(mockReportingService.generateYearlyReport).not.toHaveBeenCalled();
      });

      it('should allow current year', async () => {
        const currentYear = new Date().getFullYear();
        const currentYearReport: GenerateYearlyReportDTO = {
          year: currentYear,
        };

        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(mockYearlyReport);

        // Execute
        const result = await useCase.execute(currentYearReport);

        // Verify
        expect(result.success).toBe(true);
        expect(mockReportingService.generateYearlyReport).toHaveBeenCalledWith(currentYear);
      });
    });

    describe('error handling', () => {
      it('should handle reporting service errors gracefully', async () => {
        // Setup mocks
        mockReportingService.generateYearlyReport.mockRejectedValue(new Error('Database connection failed'));

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to generate yearly report: Database connection failed']);
        expect(result.report).toBeUndefined();
      });

      it('should handle unknown errors gracefully', async () => {
        // Setup mocks
        mockReportingService.generateYearlyReport.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to generate yearly report: Unknown error']);
        expect(result.report).toBeUndefined();
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTO', async () => {
        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(mockYearlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify response structure
        expect(result.success).toBe(true);
        expect(result.report).toBeDefined();
        expect(result.report).toHaveProperty('year');
        expect(result.report).toHaveProperty('period');
        expect(result.report).toHaveProperty('summary');
        expect(result.report).toHaveProperty('monthlyBreakdown');
        expect(result.report).toHaveProperty('categoryBreakdown');
        expect(result.report).toHaveProperty('trends');

        // Verify dates are ISO strings
        expect(result.report!.period.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.report!.period.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should properly map monthly breakdown data', async () => {
        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(mockYearlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify monthly breakdown
        expect(result.report?.monthlyBreakdown).toHaveLength(2);
        
        const januaryData = result.report?.monthlyBreakdown.find(m => m.month === 1);
        expect(januaryData).toBeDefined();
        expect(januaryData?.year).toBe(2024);
        expect(januaryData?.totalIncome).toBe(5000);
        expect(januaryData?.totalExpense).toBe(3500);
        expect(januaryData?.net).toBe(1500);
        expect(januaryData?.currency).toBe('BRL');
      });

      it('should properly map trends data', async () => {
        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(mockYearlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify trends
        expect(result.report?.trends).toBeDefined();
        expect(result.report?.trends.incomeGrowth).toBe(5.2);
        expect(result.report?.trends.expenseGrowth).toBe(3.8);
        expect(result.report?.trends.bestMonth.month).toBe(2);
        expect(result.report?.trends.bestMonth.net).toBe(2000);
        expect(result.report?.trends.bestMonth.currency).toBe('BRL');
      });
    });

    describe('edge cases', () => {
      it('should handle very large yearly amounts', async () => {
        const largeAmountReport: YearlyReport = {
          ...mockYearlyReport,
          summary: {
            totalIncome: new Money(9999999999.99, 'BRL'),
            totalExpense: new Money(8888888888.88, 'BRL'),
            net: new Money(1111111111.11, 'BRL'),
            avgMonthlyIncome: new Money(833333333.33, 'BRL'),
            avgMonthlyExpense: new Money(740740740.74, 'BRL'),
            transactionCount: 10000000,
            monthsWithData: 12,
          },
        };

        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(largeAmountReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.summary.totalIncome).toBe(9999999999.99);
        expect(result.report?.summary.totalExpense).toBe(8888888888.88);
        expect(result.report?.summary.net).toBe(1111111111.11);
        expect(result.report?.summary.transactionCount).toBe(10000000);
      });

      it('should handle leap year edge case', async () => {
        const leapYearReport: GenerateYearlyReportDTO = {
          year: 2024, // Leap year
        };

        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(mockYearlyReport);

        // Execute
        const result = await useCase.execute(leapYearReport);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.year).toBe(2024);
        expect(mockReportingService.generateYearlyReport).toHaveBeenCalledWith(2024);
      });
    });

    describe('response format', () => {
      it('should return success response with report property', async () => {
        // Setup mocks
        mockReportingService.generateYearlyReport.mockResolvedValue(mockYearlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify response structure
        expect(result).toEqual({
          success: true,
          report: expect.objectContaining({
            year: 2024,
            summary: expect.objectContaining({
              totalIncome: 60000,
              totalExpense: 42000,
              net: 18000,
            }),
          }),
        });
        expect(result).not.toHaveProperty('data');
        expect(result.errors).toBeUndefined();
      });

      it('should return error response with proper structure', async () => {
        const invalidReport: GenerateYearlyReportDTO = {
          year: 1999,
        };

        // Execute
        const result = await useCase.execute(invalidReport);

        // Verify response structure
        expect(result).toEqual({
          success: false,
          errors: ['Year must be between 2000 and current year'],
        });
        expect(result).not.toHaveProperty('report');
        expect(result).not.toHaveProperty('data');
      });
    });
  });
}); 