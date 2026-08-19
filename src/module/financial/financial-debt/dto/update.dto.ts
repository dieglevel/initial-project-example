import { PartialType } from "@nestjs/swagger";
import { FinancialDebtEntity } from "../_entities/financial-debt.entity";

export class FinancialDebt_Update_Request extends PartialType(
  FinancialDebtEntity,
) {}

export class FinancialDebt_Update_Response extends FinancialDebtEntity {}
