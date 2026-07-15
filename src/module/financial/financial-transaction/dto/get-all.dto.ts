import { OmitType } from "@nestjs/swagger";
import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";

export class FinancialTransaction_GetAll_Response extends OmitType(
  FinancialTransactionEntity,
  [],
) {}
