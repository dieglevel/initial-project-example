import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
import { PartialType } from "@nestjs/swagger";
import { FinancialTransaction_Create_Request } from "./create.dto";

export class FinancialTransaction_Update_Request extends PartialType(
  FinancialTransaction_Create_Request,
) {}

export class FinancialTransaction_Update_Response extends FinancialTransactionEntity {}
