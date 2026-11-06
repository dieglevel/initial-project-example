import { ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { CreateFinancialGoalDto } from "./create.dto";
import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";

/**
 * Không cho đổi `status` qua update — dùng cancel / pause / resume.
 * `currentAmount` không bao giờ sửa trực tiếp (chỉ qua góp / rút).
 */
export class UpdateFinancialGoalDto extends PartialType(
  OmitType(CreateFinancialGoalDto, ["status"] as const),
) {}

export class CompleteAutoContributionDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: "Trừ tiền từ ví này. Bỏ trống = chỉ ghi sổ, ví không đổi.",
  })
  @IsInt()
  @IsOptional()
  walletId?: number;
}

// Aliases cho Swagger/Controller
export class FinancialGoal_Update_Request extends UpdateFinancialGoalDto {}
export class FinancialGoal_Update_Response {}
