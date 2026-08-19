import { OmitType } from "@nestjs/swagger";
import { FinancialDebtHistoryEntity } from "../_entities/financial-debt-history.entity";

export class FinancialDebtHistory_GetAll_Response extends OmitType(
  FinancialDebtHistoryEntity,
  [],
) {}
