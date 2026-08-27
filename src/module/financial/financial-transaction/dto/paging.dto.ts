import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import {
  FINANCIAL_TRANSACTION_STATUS,
  FINANCIAL_TRANSACTION_TYPE,
} from "../financial-transaction.enum";
import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";

// Khai báo các cột cho phép Filter để tránh SQL Injection
export class FinancialTransaction_Filterable_Columns {
  @ApiPropertyOptional({ enum: FINANCIAL_TRANSACTION_TYPE })
  @IsEnum(FINANCIAL_TRANSACTION_TYPE)
  @IsOptional()
  type?: FINANCIAL_TRANSACTION_TYPE;

  @ApiPropertyOptional({ enum: FINANCIAL_TRANSACTION_STATUS })
  @IsEnum(FINANCIAL_TRANSACTION_STATUS)
  @IsOptional()
  status?: FINANCIAL_TRANSACTION_STATUS;

  @ApiPropertyOptional({ description: "Lọc theo ID ví" })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  walletId?: number;

  @ApiPropertyOptional({ description: "Lọc theo khoảng số tiền tối thiểu" })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: "Lọc theo khoảng số tiền tối đa" })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({ description: "Lọc từ ngày (YYYY-MM-DD)" })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: "Lọc đến ngày (YYYY-MM-DD)" })
  @IsDateString()
  @IsOptional()
  toDate?: string;
}

// Khai báo các cột cho phép Sort để tránh SQL Injection
export enum FinancialTransactionSortBy {
  CREATED_AT = "createdAt",
  AMOUNT = "amount",
  TYPE = "type",
  STATUS = "status",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export class FinancialTransaction_GetAll_Request {
  // --- PHÂN TRANG (PAGING) ---
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Tìm theo từ khóa (description, merchant, location)",
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ type: FinancialTransaction_Filterable_Columns })
  @IsOptional()
  filter?: FinancialTransaction_Filterable_Columns;

  // --- SẮP XẾP (SORT) ---
  @ApiPropertyOptional({
    enum: FinancialTransactionSortBy,
    default: FinancialTransactionSortBy.CREATED_AT,
  })
  @IsEnum(FinancialTransactionSortBy)
  @IsOptional()
  sortBy?: FinancialTransactionSortBy = FinancialTransactionSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
export class FinancialTransaction_Paging_Response {
  @ApiPropertyOptional({ type: [FinancialTransactionEntity] })
  data: FinancialTransactionEntity[];

  @ApiPropertyOptional({ description: "Tổng số tiền chi tiêu" })
  totalExpense: number;

  @ApiPropertyOptional({ description: "Tổng số tiền thu nhập" })
  totalIncome: number;

  @ApiPropertyOptional({ type: BasePaginatedDto })
  meta: BasePaginatedDto;
}
