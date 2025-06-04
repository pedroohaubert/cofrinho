import { ReportingService } from '../../../domain/services/reporting-service.js';
import { GenerateYearlyReportDTO, YearlyReportResponseDTO, ReportDTOMapper } from '../../dto/report.dto.js';

export interface GenerateYearlyReportUseCaseResult {
  success: boolean;
  report?: YearlyReportResponseDTO;
  errors?: string[];
}

export class GenerateYearlyReportUseCase {
  constructor(
    private readonly reportingService: ReportingService
  ) {}

  async execute(dto: GenerateYearlyReportDTO): Promise<GenerateYearlyReportUseCaseResult> {
    try {
      // Validate year
      const errors = this.validateYear(dto.year);
      if (errors.length > 0) {
        return {
          success: false,
          errors,
        };
      }

      // Generate the yearly report
      const report = await this.reportingService.generateYearlyReport(dto.year);

      return {
        success: true,
        report: ReportDTOMapper.toYearlyReportResponseDTO(report),
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to generate yearly report: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private validateYear(year: number): string[] {
    const errors: string[] = [];
    const currentYear = new Date().getFullYear();

    // Validate year range
    if (year < 2000 || year > currentYear) {
      errors.push('Year must be between 2000 and current year');
    }

    // Don't allow future years
    if (year > currentYear) {
      errors.push('Cannot generate report for future years');
    }

    return errors;
  }
} 