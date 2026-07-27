import { OmitType } from "@nestjs/swagger";
import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
export class FinancialTransaction_GetWithDate_Request {
  date: Date;
}

export class FinancialTransaction_GetWithDate_Response extends OmitType(
  FinancialTransactionEntity,
  [],
) {}
