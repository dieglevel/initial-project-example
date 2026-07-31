import { ApiPropertyOptional } from "@nestjs/swagger";

export class FinancialGoal_Projection_Request {
  @ApiPropertyOptional({
    description: "Average monthly contribution for projection",
    example: 5000000,
  })
  monthlySavingRate?: number;
}

export class FinancialGoal_Projection_Response {
  goalId: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  monthlySavingRate: number;
  estimatedMonthsToComplete: number | null;
  estimatedCompletionDate: Date | null;
  progressPercentage: number;
}
