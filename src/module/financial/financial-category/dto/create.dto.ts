import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { FinancialCategoryEntity } from "../_entities/financial-category.entity";
import { PartialType } from "@nestjs/swagger";

export class FinancialCategory_Create_Request extends PartialType(
  FinancialCategoryEntity,
) {}

export class FinancialCategory_Create_Response extends FinancialCategoryEntity {}
