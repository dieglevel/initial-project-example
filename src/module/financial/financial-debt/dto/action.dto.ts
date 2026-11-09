import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
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
import { FINANCIAL_DEBT_DIRECTION_ENUM } from "../financial-debt.enum";

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

export class FinancialDebt_Increase_Request extends DebtActionBase {
  @ApiProperty({ description: "Số tiền vay / cho vay thêm" })
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

export class FinancialDebt_Merge_Request {
  @ApiProperty({ description: "Khoản giữ lại sau khi gộp" })
  @IsInt()
  targetId: number;

  @ApiProperty({ type: [Number], description: "Các khoản gộp vào targetId" })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  sourceIds: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class FinancialDebt_PersonPayment_Request extends DebtActionBase {
  @ApiProperty({ description: "Tên người (không phân biệt hoa thường)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  namePerson: string;

  @ApiProperty({ enum: FINANCIAL_DEBT_DIRECTION_ENUM })
  @IsEnum(FINANCIAL_DEBT_DIRECTION_ENUM)
  direction: FINANCIAL_DEBT_DIRECTION_ENUM;

  @ApiProperty({ description: "Tổng số tiền, phân bổ khoản cũ trước (FIFO)" })
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
