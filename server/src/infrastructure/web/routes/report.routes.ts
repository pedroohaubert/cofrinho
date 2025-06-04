import { ReportController } from '../controllers/report.controller';
import { createOpenAPIApp } from '../docs/openapi.config';
import {
  getSummaryReportRoute,
  getMonthlyReportRoute,
  getYearlyReportRoute
} from '../docs/report.openapi';

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