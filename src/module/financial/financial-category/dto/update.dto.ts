import { FinancialCategoryEntity } from "../_entities/financial-category.entity";
import { PartialType } from "@nestjs/swagger/dist/type-helpers/partial-type.helper";

export class FinancialCategory_Update_Request extends PartialType(
  FinancialCategoryEntity,
) {}

export class FinancialCategory_Update_Response extends FinancialCategoryEntity {}
