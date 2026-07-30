import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import { OmitType, PartialType } from "@nestjs/swagger";
import { FinancialAdvanceTransactionEntity } from "../_entities/financial-advance-transaction.entity";
import { FINANCIAL_TRANSACTION_TYPE } from "../../financial-transaction.enum";
import { FinancialTransaction_Create_Request } from "../../dto/create.dto";
import { Type } from "class-transformer";

export class FinancialAdvanceTransaction_Create_Data_Request extends OmitType(
  FinancialAdvanceTransactionEntity,
  ["id", "createdAt", "updatedAt", "transactionId"],
) {}

export class FinancialAdvanceTransaction_Create_Request extends OmitType(
  FinancialTransaction_Create_Request,
  ["financialAdvanceTransactions", "amount"],
) {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinancialAdvanceTransaction_Create_Data_Request)
  data: FinancialAdvanceTransaction_Create_Data_Request[];
}

export class FinancialAdvanceTransaction_Create_Response extends FinancialAdvanceTransactionEntity {}
