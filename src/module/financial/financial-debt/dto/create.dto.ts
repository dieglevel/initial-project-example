import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { FinancialDebtEntity } from "../_entities/financial-debt.entity";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
} from "class-validator";

export class FinancialDebt_Create_Request extends PartialType(
  FinancialDebtEntity,
) {
  @ApiPropertyOptional({
    description: "Bỏ trống = không thay đổi số dư ví nào",
  })
  @IsOptional()
  @IsInt()
  walletId?: number;

  @ApiProperty({ example: "2026-09-23" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dueDate?: string;
}

export class FinancialDebt_Create_Response extends FinancialDebtEntity {}
