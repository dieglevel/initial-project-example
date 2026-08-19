import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from "class-validator";

export class FinancialDebt_Payment_Request {
  @ApiProperty({ description: "ID ví thực hiện thanh toán" })
  @IsNumber()
  @IsNotEmpty()
  walletId: number;

  @ApiProperty({ description: "Số tiền thanh toán", example: 100000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ description: "Ghi chú thanh toán" })
  @IsString()
  @IsOptional()
  note?: string;
}

export class FinancialDebt_Adjust_Request {
  @ApiProperty({ description: "Số tiền nợ còn lại mới sau điều chỉnh" })
  @IsNumber()
  @Min(0)
  outstandingAmount: number;

  @ApiPropertyOptional({ description: "Lý do điều chỉnh" })
  @IsString()
  @IsOptional()
  note?: string;
}

export class FinancialDebt_Settle_Request {
  @ApiPropertyOptional({ description: "Ghi chú tất toán" })
  @IsString()
  @IsOptional()
  note?: string;
}

export class FinancialDebt_Cancel_Request {
  @ApiPropertyOptional({ description: "Lý do hủy khoản nợ" })
  @IsString()
  @IsOptional()
  note?: string;
}
