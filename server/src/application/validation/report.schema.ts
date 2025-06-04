import { z } from 'zod';

// Request validation schemas
export const GenerateMonthlyReportSchema = z.object({
  year: z.number().int().min(2000).max(new Date().getFullYear() + 1),
  month: z.number().int().min(1).max(12),
}).refine(
  (data) => {
    const reportDate = new Date(data.year, data.month - 1, 1);
    const currentDate = new Date();
    const maxDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    return reportDate <= maxDate;
  },
  {
    message: 'Cannot generate report for future months beyond next month',
    path: ['year'],
  }
);

export const GenerateYearlyReportSchema = z.object({
  year: z.number().int().min(2000).max(new Date().getFullYear()),
});

// Response schemas
export const CategoryBreakdownItemSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  type: z.enum(['income', 'expense']),
  totalAmount: z.number(),
  currency: z.string(),
  transactionCount: z.number().int().min(0),
  averageAmount: z.number(),
  percentage: z.number().min(0).max(100),
});

export const PaymentMethodBreakdownItemSchema = z.object({
  paymentMethodId: z.string(),
  paymentMethodName: z.string(),
  paymentMethodType: z.string(),
  totalAmount: z.number(),
  currency: z.string(),
  transactionCount: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
});

export const MonthlyBreakdownItemSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  totalIncome: z.number(),
  totalExpense: z.number(),
  net: z.number(),
  currency: z.string(),
});

export const DailyTrendSchema = z.object({
  date: z.string().datetime(),
  income: z.number(),
  expense: z.number(),
  net: z.number(),
  currency: z.string(),
});

export const MonthlyReportResponseSchema = z.object({
  period: z.object({
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  summary: z.object({
    totalIncome: z.number(),
    totalExpense: z.number(),
    net: z.number(),
    currency: z.string(),
    transactionCount: z.number().int().min(0),
    averageTransactionAmount: z.number(),
  }),
  categoryBreakdown: z.array(CategoryBreakdownItemSchema),
  paymentMethodBreakdown: z.array(PaymentMethodBreakdownItemSchema),
  topExpenseCategories: z.array(CategoryBreakdownItemSchema),
  topIncomeCategories: z.array(CategoryBreakdownItemSchema),
  dailyTrends: z.array(DailyTrendSchema),
});

export const YearlyReportResponseSchema = z.object({
  year: z.number().int(),
  period: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  summary: z.object({
    totalIncome: z.number(),
    totalExpense: z.number(),
    net: z.number(),
    currency: z.string(),
    avgMonthlyIncome: z.number(),
    avgMonthlyExpense: z.number(),
    transactionCount: z.number().int().min(0),
    monthsWithData: z.number().int().min(0).max(12),
  }),
  monthlyBreakdown: z.array(MonthlyBreakdownItemSchema),
  categoryBreakdown: z.array(CategoryBreakdownItemSchema),
  trends: z.object({
    incomeGrowth: z.number(),
    expenseGrowth: z.number(),
    bestMonth: z.object({
      month: z.number().int().min(1).max(12),
      net: z.number(),
      currency: z.string(),
    }),
    worstMonth: z.object({
      month: z.number().int().min(1).max(12),
      net: z.number(),
      currency: z.string(),
    }),
  }),
});

// Parameter validation schemas
export const MonthlyReportParamsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1),
  month: z.coerce.number().int().min(1).max(12),
});

export const YearlyReportParamsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(new Date().getFullYear()),
});

// Type exports for TypeScript inference
export type GenerateMonthlyReportRequest = z.infer<typeof GenerateMonthlyReportSchema>;
export type GenerateYearlyReportRequest = z.infer<typeof GenerateYearlyReportSchema>;
export type CategoryBreakdownItem = z.infer<typeof CategoryBreakdownItemSchema>;
export type PaymentMethodBreakdownItem = z.infer<typeof PaymentMethodBreakdownItemSchema>;
export type MonthlyBreakdownItem = z.infer<typeof MonthlyBreakdownItemSchema>;
export type DailyTrend = z.infer<typeof DailyTrendSchema>;
export type MonthlyReportResponse = z.infer<typeof MonthlyReportResponseSchema>;
export type YearlyReportResponse = z.infer<typeof YearlyReportResponseSchema>;
export type MonthlyReportParams = z.infer<typeof MonthlyReportParamsSchema>;
export type YearlyReportParams = z.infer<typeof YearlyReportParamsSchema>; 