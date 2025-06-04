import { ReportingService } from '../../../domain/services/reporting-service.js';
import { GenerateMonthlyReportDTO, MonthlyReportResponseDTO, ReportDTOMapper } from '../../dto/report.dto.js';

export interface GenerateMonthlyReportUseCaseResult {
  success: boolean;
  report?: MonthlyReportResponseDTO;
  errors?: string[];
}

export class GenerateMonthlyReportUseCase {
  constructor(
    private readonly reportingService: ReportingService
  ) {}

  async execute(dto: GenerateMonthlyReportDTO): Promise<GenerateMonthlyReportUseCaseResult> {
    try {
      // Validate month and year
      const errors = this.validateDate(dto.year, dto.month);
      if (errors.length > 0) {
        return {
          success: false,
          errors,
        };
      }

      // Generate the monthly report
      const report = await this.reportingService.generateMonthlyReport(dto.year, dto.month);

      return {
        success: true,
        report: ReportDTOMapper.toMonthlyReportResponseDTO(report),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to generate monthly report: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private validateDate(year: number, month: number): string[] {
    const errors: string[] = [];
    const currentYear = new Date().getFullYear();

    // Validate year
    if (year < 2000 || year > currentYear + 1) {
      errors.push('Year must be between 2000 and next year');
    }

    // Validate month
    if (month < 1 || month > 12) {
      errors.push('Month must be between 1 and 12');
    }

    // Check if date is not too far in the future
    const reportDate = new Date(year, month - 1, 1);
    const currentDate = new Date();
    const maxDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    if (reportDate > maxDate) {
      errors.push('Cannot generate report for future months beyond next month');
    }

    return errors;
  }
} 