import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
import { PartialType } from "@nestjs/swagger";

export class FinancialTransaction_Create_Request extends PartialType(
  FinancialTransactionEntity,
) {}

export class FinancialTransaction_Create_Response extends FinancialTransactionEntity {}
