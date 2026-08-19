import { OmitType } from "@nestjs/swagger";
import { FinancialDebtEntity } from "../_entities/financial-debt.entity";

export class FinancialDebt_GetAll_Response extends OmitType(
  FinancialDebtEntity,
  [],
) {}
