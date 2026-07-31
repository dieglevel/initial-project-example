import { ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { FinancialCategoryEntity } from "../_entities/financial-category.entity";

export class FinancialCategory_GetBudgetStatus_Request {
  @ApiPropertyOptional({
    description: "Target date for month aggregation",
    example: "2026-07-01",
  })
  date?: Date;
}

export enum FINANCIAL_BUDGET_ALERT_LEVEL {
  NORMAL = "normal",
  WARNING_80 = "warning_80",
  EXCEEDED = "exceeded",
}

export class FinancialCategory_GetBudgetStatus_Response extends OmitType(
  FinancialCategoryEntity,
  [],
) {
  spentAmount: number;
  remainingBudget: number;
  spentPercentage: number;
  alertLevel: FINANCIAL_BUDGET_ALERT_LEVEL;
}
