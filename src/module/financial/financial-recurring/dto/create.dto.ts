import { PartialType } from "@nestjs/swagger";
import { FinancialRecurringEntity } from "../_entities/financial-recurring.entity";

export class FinancialRecurring_Create_Request extends PartialType(
  FinancialRecurringEntity,
) {}

export class FinancialRecurring_Create_Response extends FinancialRecurringEntity {}
