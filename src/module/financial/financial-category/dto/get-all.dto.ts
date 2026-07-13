import { OmitType } from "@nestjs/swagger";
import { FinancialCategoryEntity } from "../_entities/financial-category.entity";

export class FinancialCategory_GetAll_Response extends OmitType(
  FinancialCategoryEntity,
  [],
) {}
