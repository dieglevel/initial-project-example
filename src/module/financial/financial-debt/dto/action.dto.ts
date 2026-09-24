import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

class DebtActionBase {
  @ApiPropertyOptional({
    example: "2026-09-23",
    description: "Ngày giao dịch thực tế, mặc định hôm nay",
  })
  @IsOptional()
  @Matches(DATE_REGEX, { message: "occurredAt must be YYYY-MM-DD" })
  occurredAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class FinancialDebt_Payment_Request extends DebtActionBase {
  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    description: "Bỏ trống = không thay đổi số dư ví nào",
  })
  @IsOptional()
  @IsInt()
  walletId?: number;
}

export class FinancialDebt_Adjust_Request extends DebtActionBase {
  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  outstandingAmount: number;
}

export class FinancialDebt_Settle_Request extends DebtActionBase {}
export class FinancialDebt_Cancel_Request extends DebtActionBase {}

export class FinancialDebt_Correct_Request extends DebtActionBase {
  @ApiProperty({ description: "Số tiền gốc đúng" })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  originalAmount: number;
}
