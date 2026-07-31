import { ApiPropertyOptional } from "@nestjs/swagger";

export enum FINANCIAL_REPORT_PERIOD {
  WEEK = "week",
  MONTH = "month",
  QUARTER = "quarter",
  YEAR = "year",
  CUSTOM = "custom",
}

export class FinancialReport_Query_Request {
  @ApiPropertyOptional({ enum: FINANCIAL_REPORT_PERIOD })
  period?: FINANCIAL_REPORT_PERIOD;

  @ApiPropertyOptional({
    description: "Anchor date for non-custom periods",
    example: "2026-07-31",
  })
  date?: Date;

  @ApiPropertyOptional({
    description: "Range start, required for custom period",
    example: "2026-07-01",
  })
  from?: Date;

  @ApiPropertyOptional({
    description: "Range end, required for custom period",
    example: "2026-07-31",
  })
  to?: Date;
}
