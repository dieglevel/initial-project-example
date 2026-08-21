import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
import { Type } from "class-transformer";
import {
  FINANCIAL_TRANSACTION_STATUS,
  FINANCIAL_TRANSACTION_TYPE,
} from "../financial-transaction.enum";

export class FinancialTransaction_Create_Item_Request {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsInt()
  @IsOptional()
  categoryId?: number;
}

export class FinancialTransaction_Create_Request {
  @IsInt()
  walletId: number;

  @IsNumber()
  amount: number;

  @IsEnum(FINANCIAL_TRANSACTION_TYPE)
  type: FINANCIAL_TRANSACTION_TYPE;

  @IsEnum(FINANCIAL_TRANSACTION_STATUS)
  @IsOptional()
  status?: FINANCIAL_TRANSACTION_STATUS;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  merchant?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  receiptImageUrl?: string;

  @IsInt()
  @IsOptional()
  originalTransactionId?: number;

  @IsDateString()
  @IsOptional()
  date?: Date;

  @ValidateNested({ each: true })
  @Type(() => FinancialTransaction_Create_Item_Request)
  @IsOptional()
  financialTransactionItems?: FinancialTransaction_Create_Item_Request[];

  @IsInt()
  @IsOptional()
  toWalletId?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  transferFee?: number;
}

export class FinancialTransaction_Create_Response extends FinancialTransactionEntity {}
