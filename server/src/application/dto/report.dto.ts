// Request DTOs
export interface GenerateMonthlyReportDTO {
  year: number;
  month: number; // 1-12
}

export interface GenerateYearlyReportDTO {
  year: number;
}

// Response DTOs
export interface MonthlyReportResponseDTO {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    currency: string;
    transactionCount: number;
    averageTransactionAmount: number;
  };
  categoryBreakdown: CategoryBreakdownItemDTO[];
  paymentMethodBreakdown: PaymentMethodBreakdownItemDTO[];
  topExpenseCategories: CategoryBreakdownItemDTO[];
  topIncomeCategories: CategoryBreakdownItemDTO[];
  dailyTrends: DailyTrendDTO[];
}

export interface YearlyReportResponseDTO {
  year: number;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    net: number;
    currency: string;
    avgMonthlyIncome: number;
    avgMonthlyExpense: number;
    transactionCount: number;
    monthsWithData: number;
  };
  monthlyBreakdown: MonthlyBreakdownItemDTO[];
  categoryBreakdown: CategoryBreakdownItemDTO[];
  trends: {
    incomeGrowth: number;
    expenseGrowth: number;
    bestMonth: {
      month: number;
      net: number;
      currency: string;
    };
    worstMonth: {
      month: number;
      net: number;
      currency: string;
    };
  };
}

export interface CategoryBreakdownItemDTO {
  categoryId: string;
  categoryName: string;
  type: 'income' | 'expense';
  totalAmount: number;
  currency: string;
  transactionCount: number;
  averageAmount: number;
  percentage: number;
}

export interface PaymentMethodBreakdownItemDTO {
  paymentMethodId: string;
  paymentMethodName: string;
  paymentMethodType: string;
  totalAmount: number;
  currency: string;
  transactionCount: number;
  percentage: number;
}

export interface MonthlyBreakdownItemDTO {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  currency: string;
}

export interface DailyTrendDTO {
  date: string;
  income: number;
  expense: number;
  net: number;
  currency: string;
}

// Utility mapper
export class ReportDTOMapper {
  static toMonthlyReportResponseDTO(report: any): MonthlyReportResponseDTO {
    return {
      period: {
        year: report.period.startDate.getFullYear(),
        month: report.period.startDate.getMonth() + 1,
        startDate: report.period.startDate.toISOString(),
        endDate: report.period.endDate.toISOString(),
      },
      summary: {
        totalIncome: report.summary.totalIncome.amount,
        totalExpense: report.summary.totalExpense.amount,
        net: report.summary.net.amount,
        currency: report.summary.totalIncome.currency,
        transactionCount: report.summary.transactionCount,
        averageTransactionAmount: report.summary.averageTransactionAmount.amount,
      },
      categoryBreakdown: report.categoryBreakdown.map((item: any) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount.amount,
        percentage: item.percentage,
      })),
      paymentMethodBreakdown: report.paymentMethodBreakdown.map((item: any) => ({
        paymentMethodId: item.paymentMethodId,
        paymentMethodName: item.paymentMethodName,
        paymentMethodType: item.paymentMethodType,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        percentage: item.percentage,
      })),
      topExpenseCategories: report.topExpenseCategories.map((item: any) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount.amount,
        percentage: item.percentage,
      })),
      topIncomeCategories: report.topIncomeCategories.map((item: any) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount.amount,
        percentage: item.percentage,
      })),
      dailyTrends: report.dailyTrends.map((trend: any) => ({
        date: trend.date.toISOString(),
        income: trend.income.amount,
        expense: trend.expense.amount,
        net: trend.net.amount,
        currency: trend.income.currency,
      })),
    };
  }

  static toYearlyReportResponseDTO(report: any): YearlyReportResponseDTO {
    return {
      year: report.year,
      period: {
        startDate: report.period.startDate.toISOString(),
        endDate: report.period.endDate.toISOString(),
      },
      summary: {
        totalIncome: report.summary.totalIncome.amount,
        totalExpense: report.summary.totalExpense.amount,
        net: report.summary.net.amount,
        currency: report.summary.totalIncome.currency,
        avgMonthlyIncome: report.summary.avgMonthlyIncome.amount,
        avgMonthlyExpense: report.summary.avgMonthlyExpense.amount,
        transactionCount: report.summary.transactionCount,
        monthsWithData: report.summary.monthsWithData,
      },
      monthlyBreakdown: report.monthlyBreakdown.map((item: any) => ({
        month: item.month,
        year: item.year,
        totalIncome: item.totalIncome.amount,
        totalExpense: item.totalExpense.amount,
        net: item.net.amount,
        currency: item.totalIncome.currency,
      })),
      categoryBreakdown: report.categoryBreakdown.map((item: any) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        type: item.type,
        totalAmount: item.totalAmount.amount,
        currency: item.totalAmount.currency,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount.amount,
        percentage: item.percentage,
      })),
      trends: {
        incomeGrowth: report.trends.incomeGrowth,
        expenseGrowth: report.trends.expenseGrowth,
        bestMonth: {
          month: report.trends.bestMonth.month,
          net: report.trends.bestMonth.net.amount,
          currency: report.trends.bestMonth.net.currency,
        },
        worstMonth: {
          month: report.trends.worstMonth.month,
          net: report.trends.worstMonth.net.amount,
          currency: report.trends.worstMonth.net.currency,
        },
      },
    };
  }
} 