import { ReportController } from '@/infrastructure/web/controllers/report.controller.js';
import { createOpenAPIApp } from '@/infrastructure/web/docs/openapi.config.js';
import {
  getSummaryReportRoute,
  getMonthlyReportRoute,
  getYearlyReportRoute
} from '@/infrastructure/web/docs/report.openapi.js';

export function createReportRoutes(reportController: ReportController) {
  const router = createOpenAPIApp();

  // GET /reports/summary - Get current month and year summary
  router.openapi(getSummaryReportRoute, async (c) => {
    return reportController.getSummary(c);
  });

  // GET /reports/monthly/:year/:month - Get monthly report
  router.openapi(getMonthlyReportRoute, async (c) => {
    return reportController.getMonthlyReport(c);
  });

  // GET /reports/yearly/:year - Get yearly report
  router.openapi(getYearlyReportRoute, async (c) => {
    return reportController.getYearlyReport(c);
  });

  return router;
} 