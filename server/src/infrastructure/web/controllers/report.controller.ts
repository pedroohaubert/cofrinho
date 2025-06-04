import { Context } from 'hono';
import { GenerateMonthlyReportUseCase } from '../../../application/use-cases/report/generate-monthly-report.use-case';
import { GenerateYearlyReportUseCase } from '../../../application/use-cases/report/generate-yearly-report.use-case';

export class ReportController {
  constructor(
    private generateMonthlyReportUseCase: GenerateMonthlyReportUseCase,
    private generateYearlyReportUseCase: GenerateYearlyReportUseCase
  ) {}

  async getMonthlyReport(c: Context) {
    const year = parseInt(c.req.param('year'));
    const month = parseInt(c.req.param('month'));
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return c.json({
        error: {
          message: 'Invalid year or month parameter',
          code: 'INVALID_PARAMETERS',
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, 400);
    }
    
    try {
      const result = await this.generateMonthlyReportUseCase.execute({
        year,
        month,
      });
      
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(', ') || 'Failed to generate monthly report',
            code: 'REPORT_GENERATION_FAILED',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 400);
      }
      
      return c.json({
        data: result.report
      });
    } catch (error) {
      throw error;
    }
  }

  async getYearlyReport(c: Context) {
    const year = parseInt(c.req.param('year'));
    
    if (isNaN(year)) {
      return c.json({
        error: {
          message: 'Invalid year parameter',
          code: 'INVALID_PARAMETERS',
          timestamp: new Date().toISOString(),
          path: c.req.path,
        }
      }, 400);
    }
    
    try {
      const result = await this.generateYearlyReportUseCase.execute({
        year,
      });
      
      if (!result.success) {
        return c.json({
          error: {
            message: result.errors?.join(', ') || 'Failed to generate yearly report',
            code: 'REPORT_GENERATION_FAILED',
            timestamp: new Date().toISOString(),
            path: c.req.path,
          }
        }, 400);
      }
      
      return c.json({
        data: result.report
      });
    } catch (error) {
      throw error;
    }
  }

  async getSummary(c: Context) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    try {
      // Get current month and year reports
      const [monthlyResult, yearlyResult] = await Promise.all([
        this.generateMonthlyReportUseCase.execute({ year: currentYear, month: currentMonth }),
        this.generateYearlyReportUseCase.execute({ year: currentYear }),
      ]);
      
      return c.json({
        data: {
          currentMonth: monthlyResult.success ? monthlyResult.report : null,
          currentYear: yearlyResult.success ? yearlyResult.report : null,
          errors: [
            ...(monthlyResult.success ? [] : monthlyResult.errors || []),
            ...(yearlyResult.success ? [] : yearlyResult.errors || []),
          ],
        }
      });
    } catch (error) {
      throw error;
    }
  }
} 