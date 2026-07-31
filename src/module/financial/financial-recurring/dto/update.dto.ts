import { PartialType } from "@nestjs/swagger/dist/type-helpers/partial-type.helper";
import { FinancialRecurringEntity } from "../_entities/financial-recurring.entity";

export class FinancialRecurring_Update_Request extends PartialType(
  FinancialRecurringEntity,
) {}

export class FinancialRecurring_Update_Response extends FinancialRecurringEntity {}
