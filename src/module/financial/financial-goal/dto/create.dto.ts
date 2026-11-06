import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDate,
  IsInt,
  Min,
  Max,
  Matches,
  ValidateIf,
  IsNotEmpty,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  FINANCIAL_GOAL_SAVING_MODE,
  FINANCIAL_GOAL_STATUS,
  FINANCIAL_GOAL_TYPE,
} from "../financial-goal.enum";

export class CreateFinancialGoalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** Khóa rút tiền (mặc định false) */
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  /**
   * Bị bỏ qua khi tạo: mục tiêu mới luôn ACTIVE.
   * Đổi trạng thái qua các endpoint cancel / pause / resume.
   */
  @IsEnum(FINANCIAL_GOAL_STATUS)
  @IsOptional()
  status?: FINANCIAL_GOAL_STATUS;

  @IsEnum(FINANCIAL_GOAL_TYPE)
  @IsOptional()
  type?: FINANCIAL_GOAL_TYPE;

  @IsNumber()
  @Min(1)
  targetAmount: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date | null;

  @IsEnum(FINANCIAL_GOAL_SAVING_MODE)
  savingMode: FINANCIAL_GOAL_SAVING_MODE;

  @ValidateIf(
    (o: CreateFinancialGoalDto) =>
      o.savingMode === FINANCIAL_GOAL_SAVING_MODE.AUTO,
  )
  @IsNumber()
  @Min(1)
  autoContributionAmount?: number | null;

  @ValidateIf(
    (o: CreateFinancialGoalDto) =>
      o.savingMode === FINANCIAL_GOAL_SAVING_MODE.AUTO,
  )
  @IsInt()
  @Min(1)
  @Max(31)
  autoContributionDay?: number | null;

  @ApiPropertyOptional({
    description:
      "Ví mặc định cho góp tự động. Bỏ trống = góp tự động chỉ tạo khoản chờ xác nhận.",
  })
  @IsInt()
  @IsOptional()
  walletId?: number | null;
}

export class AddManualContributionDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  /** Kỳ "YYYY-MM"; mặc định kỳ hiện tại (giờ VN) */
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  @IsOptional()
  period?: string;

  @ApiPropertyOptional({
    description: "Trừ tiền từ ví này. Bỏ trống = chỉ ghi sổ, ví không đổi.",
  })
  @IsInt()
  @IsOptional()
  walletId?: number;
}

export class WithdrawFromGoalDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: "Cộng tiền vào ví này. Bỏ trống = chỉ ghi sổ, ví không đổi.",
  })
  @IsInt()
  @IsOptional()
  walletId?: number;
}

export class CancelGoalDto {
  @ApiPropertyOptional({
    description:
      "Hoàn toàn bộ số đã tích lũy vào ví này. Bỏ trống = không hoàn tiền.",
  })
  @IsInt()
  @IsOptional()
  refundWalletId?: number;
}

export class FinancialGoal_Create_Request extends CreateFinancialGoalDto {}
export class FinancialGoal_Create_Response {}
