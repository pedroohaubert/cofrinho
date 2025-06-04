import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateMonthlyReportUseCase } from '@/application/use-cases/report/generate-monthly-report.use-case.js';
import { ReportingService, MonthlyReport } from '@/domain/services/reporting-service.js';
import { DateRange } from '@/domain/value-objects/date-range.js';
import { Money } from '@/domain/value-objects/money.js';
import { TransactionType } from '@/domain/value-objects/transaction-type.js';
import { GenerateMonthlyReportDTO } from '@/application/dto/report.dto.js';

describe('GenerateMonthlyReportUseCase', () => {
  let useCase: GenerateMonthlyReportUseCase;
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

    useCase = new GenerateMonthlyReportUseCase(mockReportingService);
  });

  describe('execute', () => {
    const validReportDTO: GenerateMonthlyReportDTO = {
      year: 2024,
      month: 3, // March
    };

    const mockMonthlyReport: MonthlyReport = {
      period: DateRange.monthlyRange(2024, 3),
      summary: {
        totalIncome: new Money(5000, 'BRL'),
        totalExpense: new Money(3500, 'BRL'),
        net: new Money(1500, 'BRL'),
        transactionCount: 45,
        averageTransactionAmount: new Money(188.89, 'BRL'),
      },
      categoryBreakdown: [
        {
          categoryId: 'cat-salary',
          categoryName: 'Salary',
          type: TransactionType.INCOME,
          totalAmount: new Money(5000, 'BRL'),
          transactionCount: 1,
          averageAmount: new Money(5000, 'BRL'),
          percentage: 100,
        },
        {
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          type: TransactionType.EXPENSE,
          totalAmount: new Money(2000, 'BRL'),
          transactionCount: 20,
          averageAmount: new Money(100, 'BRL'),
          percentage: 57.14,
        },
      ],
      paymentMethodBreakdown: [
        {
          paymentMethodId: 'pm-bank',
          paymentMethodName: 'Bank Account',
          paymentMethodType: 'bank_account',
          totalAmount: new Money(5000, 'BRL'),
          transactionCount: 1,
          percentage: 58.82,
        },
        {
          paymentMethodId: 'pm-credit',
          paymentMethodName: 'Credit Card',
          paymentMethodType: 'credit_card',
          totalAmount: new Money(3500, 'BRL'),
          transactionCount: 44,
          percentage: 41.18,
        },
      ],
      topExpenseCategories: [
        {
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          type: TransactionType.EXPENSE,
          totalAmount: new Money(2000, 'BRL'),
          transactionCount: 20,
          averageAmount: new Money(100, 'BRL'),
          percentage: 57.14,
        },
      ],
      topIncomeCategories: [
        {
          categoryId: 'cat-salary',
          categoryName: 'Salary',
          type: TransactionType.INCOME,
          totalAmount: new Money(5000, 'BRL'),
          transactionCount: 1,
          averageAmount: new Money(5000, 'BRL'),
          percentage: 100,
        },
      ],
      dailyTrends: [
        {
          date: new Date('2024-03-01'),
          income: new Money(5000, 'BRL'),
          expense: new Money(0, 'BRL'),
          net: new Money(5000, 'BRL'),
        },
        {
          date: new Date('2024-03-15'),
          income: new Money(0, 'BRL'),
          expense: new Money(500, 'BRL'),
          // net can be conceptually negative, but Money VO cannot.
          // This might need adjustment in ReportingService or DTOs.
          // For now, setting to 0 to avoid Money constructor error.
          net: new Money(0, 'BRL'),
        },
      ],
    };

    describe('successful report generation', () => {
      it('should generate monthly report successfully', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(mockMonthlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report).toBeDefined();
        expect(result.report?.period.year).toBe(2024);
        expect(result.report?.period.month).toBe(3);
        expect(result.report?.summary.totalIncome).toBe(5000);
        expect(result.report?.summary.totalExpense).toBe(3500);
        expect(result.report?.summary.net).toBe(1500);
        expect(result.report?.summary.currency).toBe('BRL');
        expect(result.report?.summary.transactionCount).toBe(45);
        expect(result.report?.summary.averageTransactionAmount).toBeCloseTo(188.89, 2);
        expect(result.errors).toBeUndefined();

        // Verify service call
        expect(mockReportingService.generateMonthlyReport).toHaveBeenCalledWith(2024, 3);
      });

      it('should generate report for different months', async () => {
        const decemberReport: GenerateMonthlyReportDTO = {
          year: 2024,
          month: 12,
        };

        const decemberMockReport: MonthlyReport = {
          ...mockMonthlyReport,
          period: DateRange.monthlyRange(2024, 12),
        };

        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(decemberMockReport);

        // Execute
        const result = await useCase.execute(decemberReport);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.period.month).toBe(12);
        expect(mockReportingService.generateMonthlyReport).toHaveBeenCalledWith(2024, 12);
      });

      it('should generate report for different years', async () => {
        const previousYearReport: GenerateMonthlyReportDTO = {
          year: 2023,
          month: 6,
        };

        const previousYearMockReport: MonthlyReport = {
          ...mockMonthlyReport,
          period: DateRange.monthlyRange(2023, 6),
        };

        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(previousYearMockReport);

        // Execute
        const result = await useCase.execute(previousYearReport);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.period.year).toBe(2023);
        expect(result.report?.period.month).toBe(6);
        expect(mockReportingService.generateMonthlyReport).toHaveBeenCalledWith(2023, 6);
      });

      it('should handle reports with no transactions', async () => {
        const emptyReport: MonthlyReport = {
          period: DateRange.monthlyRange(2024, 1),
          summary: {
            totalIncome: Money.zero('BRL'),
            totalExpense: Money.zero('BRL'),
            net: Money.zero('BRL'),
            transactionCount: 0,
            averageTransactionAmount: Money.zero('BRL'),
          },
          categoryBreakdown: [],
          paymentMethodBreakdown: [],
          topExpenseCategories: [],
          topIncomeCategories: [],
          dailyTrends: [],
        };

        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(emptyReport);

        // Execute
        const result = await useCase.execute({ year: 2024, month: 1 });

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.summary.totalIncome).toBe(0);
        expect(result.report?.summary.totalExpense).toBe(0);
        expect(result.report?.summary.net).toBe(0);
        expect(result.report?.summary.transactionCount).toBe(0);
        expect(result.report?.categoryBreakdown).toHaveLength(0);
        expect(result.report?.dailyTrends).toHaveLength(0);
      });

      it('should handle current month report generation', async () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const currentMonthReport: GenerateMonthlyReportDTO = {
          year: currentYear,
          month: currentMonth,
        };

        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(mockMonthlyReport);

        // Execute
        const result = await useCase.execute(currentMonthReport);

        // Verify
        expect(result.success).toBe(true);
        expect(mockReportingService.generateMonthlyReport).toHaveBeenCalledWith(currentYear, currentMonth);
      });
    });

    describe('date validation', () => {
      it('should fail with invalid year (too old)', async () => {
        const invalidYearReport: GenerateMonthlyReportDTO = {
          year: 1999,
          month: 6,
        };

        // Execute
        const result = await useCase.execute(invalidYearReport);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Year must be between 2000 and next year');
        expect(result.report).toBeUndefined();
        expect(mockReportingService.generateMonthlyReport).not.toHaveBeenCalled();
      });

      it('should fail with invalid year (too far in future)', async () => {
        const futureYear = new Date().getFullYear() + 2;
        const futureYearReport: GenerateMonthlyReportDTO = {
          year: futureYear,
          month: 6,
        };

        // Execute
        const result = await useCase.execute(futureYearReport);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Year must be between 2000 and next year');
        expect(result.report).toBeUndefined();
        expect(mockReportingService.generateMonthlyReport).not.toHaveBeenCalled();
      });

      it('should fail with invalid month (too low)', async () => {
        const invalidMonthReport: GenerateMonthlyReportDTO = {
          year: 2024,
          month: 0,
        };

        // Execute
        const result = await useCase.execute(invalidMonthReport);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Month must be between 1 and 12');
        expect(result.report).toBeUndefined();
        expect(mockReportingService.generateMonthlyReport).not.toHaveBeenCalled();
      });

      it('should fail with invalid month (too high)', async () => {
        const invalidMonthReport: GenerateMonthlyReportDTO = {
          year: 2024,
          month: 13,
        };

        // Execute
        const result = await useCase.execute(invalidMonthReport);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Month must be between 1 and 12');
        expect(result.report).toBeUndefined();
        expect(mockReportingService.generateMonthlyReport).not.toHaveBeenCalled();
      });

      it('should fail for future months beyond next month', async () => {
        const currentDate = new Date();
        const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 1);
        
        const futureReport: GenerateMonthlyReportDTO = {
          year: futureDate.getFullYear(),
          month: futureDate.getMonth() + 1,
        };

        // Execute
        const result = await useCase.execute(futureReport);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Cannot generate report for future months beyond next month');
        expect(result.report).toBeUndefined();
        expect(mockReportingService.generateMonthlyReport).not.toHaveBeenCalled();
      });

      it('should allow next month report generation', async () => {
        const currentDate = new Date();
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        
        const nextMonthReport: GenerateMonthlyReportDTO = {
          year: nextMonth.getFullYear(),
          month: nextMonth.getMonth() + 1,
        };

        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(mockMonthlyReport);

        // Execute
        const result = await useCase.execute(nextMonthReport);

        // Verify
        expect(result.success).toBe(true);
        expect(mockReportingService.generateMonthlyReport).toHaveBeenCalled();
      });

      it('should handle multiple validation errors', async () => {
        const invalidReport: GenerateMonthlyReportDTO = {
          year: 1999, // Too old
          month: 13,  // Too high
        };

        // Execute
        const result = await useCase.execute(invalidReport);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain('Year must be between 2000 and next year');
        expect(result.errors).toContain('Month must be between 1 and 12');
        expect(result.report).toBeUndefined();
      });
    });

    describe('error handling', () => {
      it('should handle reporting service errors gracefully', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockRejectedValue(new Error('Database connection failed'));

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to generate monthly report: Database connection failed']);
        expect(result.report).toBeUndefined();
      });

      it('should handle service timeout errors', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockRejectedValue(new Error('Query timeout'));

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to generate monthly report: Query timeout']);
        expect(result.report).toBeUndefined();
      });

      it('should handle unknown errors gracefully', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockRejectedValue('Non-error object');

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to generate monthly report: Unknown error']);
        expect(result.report).toBeUndefined();
      });

      it('should handle service data processing errors', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockRejectedValue(new Error('Failed to calculate category breakdown'));

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(false);
        expect(result.errors).toEqual(['Failed to generate monthly report: Failed to calculate category breakdown']);
      });
    });

    describe('response DTO mapping', () => {
      it('should return properly formatted response DTO', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(mockMonthlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify response structure
        expect(result.success).toBe(true);
        expect(result.report).toBeDefined();
        expect(result.report).toHaveProperty('period');
        expect(result.report).toHaveProperty('summary');
        expect(result.report).toHaveProperty('categoryBreakdown');
        expect(result.report).toHaveProperty('paymentMethodBreakdown');
        expect(result.report).toHaveProperty('topExpenseCategories');
        expect(result.report).toHaveProperty('topIncomeCategories');
        expect(result.report).toHaveProperty('dailyTrends');

        // Verify period structure
        expect(result.report!.period).toHaveProperty('year');
        expect(result.report!.period).toHaveProperty('month');
        expect(result.report!.period).toHaveProperty('startDate');
        expect(result.report!.period).toHaveProperty('endDate');

        // Verify summary structure
        expect(result.report!.summary).toHaveProperty('totalIncome');
        expect(result.report!.summary).toHaveProperty('totalExpense');
        expect(result.report!.summary).toHaveProperty('net');
        expect(result.report!.summary).toHaveProperty('currency');
        expect(result.report!.summary).toHaveProperty('transactionCount');
        expect(result.report!.summary).toHaveProperty('averageTransactionAmount');

        // Verify dates are ISO strings
        expect(result.report!.period.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(result.report!.period.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should properly map category breakdown data', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(mockMonthlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify category breakdown
        expect(result.report?.categoryBreakdown).toHaveLength(2);
        
        const salaryCategory = result.report?.categoryBreakdown.find(c => c.categoryId === 'cat-salary');
        expect(salaryCategory).toBeDefined();
        expect(salaryCategory?.categoryName).toBe('Salary');
        expect(salaryCategory?.type).toBe('income');
        expect(salaryCategory?.totalAmount).toBe(5000);
        expect(salaryCategory?.currency).toBe('BRL');
        expect(salaryCategory?.transactionCount).toBe(1);
        expect(salaryCategory?.averageAmount).toBe(5000);
        expect(salaryCategory?.percentage).toBe(100);

        const groceriesCategory = result.report?.categoryBreakdown.find(c => c.categoryId === 'cat-groceries');
        expect(groceriesCategory).toBeDefined();
        expect(groceriesCategory?.type).toBe('expense');
        expect(groceriesCategory?.totalAmount).toBe(2000);
      });

      it('should properly map payment method breakdown data', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(mockMonthlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify payment method breakdown
        expect(result.report?.paymentMethodBreakdown).toHaveLength(2);
        
        const bankAccount = result.report?.paymentMethodBreakdown.find(p => p.paymentMethodId === 'pm-bank');
        expect(bankAccount).toBeDefined();
        expect(bankAccount?.paymentMethodName).toBe('Bank Account');
        expect(bankAccount?.paymentMethodType).toBe('bank_account');
        expect(bankAccount?.totalAmount).toBe(5000);
        expect(bankAccount?.currency).toBe('BRL');
        expect(bankAccount?.transactionCount).toBe(1);
        expect(bankAccount?.percentage).toBeCloseTo(58.82, 2);
      });

      it('should properly map daily trends data', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(mockMonthlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify daily trends
        expect(result.report?.dailyTrends).toHaveLength(2);
        
        const firstTrend = result.report?.dailyTrends[0];
        expect(firstTrend?.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(firstTrend?.income).toBe(5000);
        expect(firstTrend?.expense).toBe(0);
        expect(firstTrend?.net).toBe(5000);
        expect(firstTrend?.currency).toBe('BRL');
      });
    });

    describe('edge cases', () => {
      it('should handle leap year February report', async () => {
        const leapYearReport: GenerateMonthlyReportDTO = {
          year: 2024,
          month: 2, // February in leap year
        };

        const leapYearMockReport: MonthlyReport = {
          ...mockMonthlyReport,
          period: DateRange.monthlyRange(2024, 2),
        };

        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(leapYearMockReport);

        // Execute
        const result = await useCase.execute(leapYearReport);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.period.month).toBe(2);
        expect(mockReportingService.generateMonthlyReport).toHaveBeenCalledWith(2024, 2);
      });

      it('should handle year boundary edge cases', async () => {
        const currentYear = new Date().getFullYear();
        const testCases = [
          { year: currentYear, month: 1, description: "January of current year" },
          { year: currentYear - 1, month: 12, description: "December of previous year" },
        ];

        for (const dto of testCases) {
          // Reset and re-configure mock for each iteration
          vi.clearAllMocks(); // Corrected from resetAllMocks
          const mockReportForDate: MonthlyReport = {
            period: DateRange.monthlyRange(dto.year, dto.month),
            summary: {
              totalIncome: new Money(100, 'BRL'),
              totalExpense: new Money(50, 'BRL'),
              net: new Money(50, 'BRL'),
              transactionCount: 1,
              averageTransactionAmount: new Money(100, 'BRL'),
            },
            categoryBreakdown: [],
            paymentMethodBreakdown: [],
            topExpenseCategories: [],
            topIncomeCategories: [],
            dailyTrends: [],
          };
          mockReportingService.generateMonthlyReport.mockResolvedValue(mockReportForDate);

          const result = await useCase.execute(dto);

          if (!result.success) {
            // This console.error will only be visible if the tool shows stderr
            console.error(`Test '${dto.description}' failed for ${dto.year}-${dto.month}: Errors: ${result.errors?.join(', ')}`);
          }
          expect(result.success).toBe(true);
          expect(mockReportingService.generateMonthlyReport).toHaveBeenCalledWith(dto.year, dto.month);
        }
      });

      it('should handle reports with very large amounts', async () => {
        const largeAmountReport: MonthlyReport = {
          ...mockMonthlyReport,
          summary: {
            totalIncome: new Money(999999999.99, 'BRL'),
            totalExpense: new Money(888888888.88, 'BRL'),
            net: new Money(111111111.11, 'BRL'),
            transactionCount: 1000000,
            averageTransactionAmount: new Money(1888.89, 'BRL'),
          },
        };

        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(largeAmountReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.summary.totalIncome).toBe(999999999.99);
        expect(result.report?.summary.totalExpense).toBe(888888888.88);
        expect(result.report?.summary.net).toBe(111111111.11);
        expect(result.report?.summary.transactionCount).toBe(1000000);
      });

      it('should handle reports with different currencies', async () => {
        const usdReport: MonthlyReport = {
          ...mockMonthlyReport,
          summary: {
            ...mockMonthlyReport.summary,
            totalIncome: new Money(1000, 'USD'),
            totalExpense: new Money(750, 'USD'),
            net: new Money(250, 'USD'),
            averageTransactionAmount: new Money(38.89, 'USD'),
          },
        };

        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(usdReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify
        expect(result.success).toBe(true);
        expect(result.report?.summary.currency).toBe('USD');
        expect(result.report?.summary.totalIncome).toBe(1000);
        expect(result.report?.summary.totalExpense).toBe(750);
        expect(result.report?.summary.net).toBe(250);
      });
    });

    describe('response format', () => {
      it('should return success response with report property', async () => {
        // Setup mocks
        mockReportingService.generateMonthlyReport.mockResolvedValue(mockMonthlyReport);

        // Execute
        const result = await useCase.execute(validReportDTO);

        // Verify response structure
        expect(result).toEqual({
          success: true,
          report: expect.objectContaining({
            period: expect.objectContaining({
              year: 2024,
              month: 3,
            }),
            summary: expect.objectContaining({
              totalIncome: 5000,
              totalExpense: 3500,
              net: 1500,
            }),
          }),
        });
        expect(result).not.toHaveProperty('data');
        expect(result.errors).toBeUndefined();
      });

      it('should return error response with proper structure', async () => {
        const invalidReport: GenerateMonthlyReportDTO = {
          year: 1999,
          month: 3,
        };

        // Execute
        const result = await useCase.execute(invalidReport);

        // Verify response structure
        expect(result).toEqual({
          success: false,
          errors: ['Year must be between 2000 and next year'],
        });
        expect(result).not.toHaveProperty('report');
        expect(result).not.toHaveProperty('data');
      });

      it('should return errors in array format', async () => {
        const invalidReport: GenerateMonthlyReportDTO = {
          year: 2024,
          month: 15,
        };

        // Execute
        const result = await useCase.execute(invalidReport);

        // Verify error is in array format
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors).toHaveLength(1);
        expect(typeof result.errors?.[0]).toBe('string');
      });
    });
  });
}); 