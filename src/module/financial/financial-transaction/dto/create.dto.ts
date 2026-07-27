import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
import { OmitType, PartialType } from "@nestjs/swagger";

export class FinancialTransaction_Create_Request extends OmitType(
  FinancialTransactionEntity,
  ["id", "createdAt", "updatedAt", "category", "wallet"],
) {}

export class FinancialTransaction_Create_Response extends FinancialTransactionEntity {}
