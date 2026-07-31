import { OmitType } from "@nestjs/swagger";
import { FinancialRecurringEntity } from "../_entities/financial-recurring.entity";

export class FinancialRecurring_GetAll_Response extends OmitType(
  FinancialRecurringEntity,
  [],
) {}
