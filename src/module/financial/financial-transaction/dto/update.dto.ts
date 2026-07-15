import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
import { PartialType } from "@nestjs/swagger/dist/type-helpers/partial-type.helper";

export class FinancialTransaction_Update_Request extends PartialType(
  FinancialTransactionEntity,
) {}

export class FinancialTransaction_Update_Response extends FinancialTransactionEntity {}
