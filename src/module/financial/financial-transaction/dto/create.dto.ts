import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
import { OmitType, PartialType } from "@nestjs/swagger";

export class FinancialTransaction_Create_Request extends OmitType(
  FinancialTransactionEntity,
  ["id", "createdAt", "updatedAt", "wallet"],
) {
  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @IsNumber()
  @IsOptional()
  toWalletId?: number;

  @IsNumber()
  @IsOptional()
  transferFee?: number;
}

export class FinancialTransaction_Create_Response extends FinancialTransactionEntity {}
