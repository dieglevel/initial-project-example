import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, Min } from "class-validator";

export class FinancialGoal_Projection_Request {
  @ApiPropertyOptional({
    description:
      "Số góp mỗi tháng giả định. Bỏ trống = dùng autoContributionAmount (AUTO) hoặc 0 (MANUAL).",
    example: 5000000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlySavingRate?: number;
}

export class FinancialGoal_Projection_Response {
  goalId: number;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  /** Số góp mỗi tháng dùng để tính */
  monthlyAmount: number;
  /** null nếu monthlyAmount = 0 */
  estimatedMonthsToTarget: number | null;
  /** "YYYY-MM-DD", null nếu không ước tính được */
  estimatedCompletionDate: string | null;
  /** Số tháng còn lại tới deadline (làm tròn lên), null nếu không có deadline */
  monthsUntilDeadline: number | null;
  /** Cần góp mỗi tháng bao nhiêu để kịp deadline; null nếu không có deadline */
  requiredMonthlyAmount: number | null;
  /** monthlyAmount đủ để kịp deadline? null nếu không có deadline */
  onTrack: boolean | null;
}
