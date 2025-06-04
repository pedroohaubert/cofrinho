import { createRoute } from '@hono/zod-openapi';
import { z } from 'zod';

const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    timestamp: z.string(),
    path: z.string().optional(),
    details: z.array(z.any()).optional()
  })
});

// Response schemas for reports
const SummaryReportSchema = z.object({
  period: z.object({
    year: z.number(),
    month: z.number(),
    startDate: z.string(),
    endDate: z.string()
  }),
  totals: z.object({
    income: z.number(),
    expenses: z.number(),
    savings: z.number(),
    netFlow: z.number()
  }),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    total: z.number(),
    count: z.number()
  })),
  paymentMethods: z.array(z.object({
    id: z.string(),
    name: z.string(),
    total: z.number(),
    count: z.number()
  }))
});

const MonthlyReportSchema = z.object({
  period: z.object({
    year: z.number(),
    month: z.number(),
    startDate: z.string(),
    endDate: z.string()
  }),
  totals: z.object({
    income: z.number(),
    expenses: z.number(),
    savings: z.number(),
    netFlow: z.number()
  }),
  dailyBreakdown: z.array(z.object({
    date: z.string(),
    income: z.number(),
    expenses: z.number(),
    netFlow: z.number()
  })),
  categoryBreakdown: z.array(z.object({
    id: z.string(),
    name: z.string(),
    total: z.number(),
    count: z.number(),
    percentage: z.number()
  }))
});

const YearlyReportSchema = z.object({
  period: z.object({
    year: z.number(),
    startDate: z.string(),
    endDate: z.string()
  }),
  totals: z.object({
    income: z.number(),
    expenses: z.number(),
    savings: z.number(),
    netFlow: z.number()
  }),
  monthlyBreakdown: z.array(z.object({
    month: z.number(),
    income: z.number(),
    expenses: z.number(),
    netFlow: z.number()
  })),
  categoryBreakdown: z.array(z.object({
    id: z.string(),
    name: z.string(),
    total: z.number(),
    count: z.number(),
    percentage: z.number()
  }))
});

// Parameter schemas
const YearMonthParamSchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number').openapi({ param: { name: 'year', in: 'path' } }),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'Month must be between 1 and 12').openapi({ param: { name: 'month', in: 'path' } })
});

const YearParamSchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number').openapi({ param: { name: 'year', in: 'path' } })
});

// GET /reports/summary
export const getSummaryReportRoute = createRoute({
  method: 'get',
  path: '/summary',
  tags: ['Reports'],
  summary: 'Get report summary',
  description: 'Get current month and year financial summary',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SummaryReportSchema
        }
      },
      description: 'Financial summary report'
    }
  }
});

// GET /reports/monthly/:year/:month
export const getMonthlyReportRoute = createRoute({
  method: 'get',
  path: '/monthly/{year}/{month}',
  tags: ['Reports'],
  summary: 'Get monthly report',
  description: 'Generate detailed monthly financial report',
  request: {
    params: YearMonthParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: MonthlyReportSchema
        }
      },
      description: 'Monthly financial report'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Invalid date parameters'
    }
  }
});

// GET /reports/yearly/:year
export const getYearlyReportRoute = createRoute({
  method: 'get',
  path: '/yearly/{year}',
  tags: ['Reports'],
  summary: 'Get yearly report',
  description: 'Generate detailed yearly financial report',
  request: {
    params: YearParamSchema
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: YearlyReportSchema
        }
      },
      description: 'Yearly financial report'
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      },
      description: 'Invalid year parameter'
    }
  }
}); 