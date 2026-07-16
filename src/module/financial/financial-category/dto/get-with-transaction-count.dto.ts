import { OmitType } from "@nestjs/swagger";
import { FinancialCategoryEntity } from "../_entities/financial-category.entity";
export class FinancialCategory_GetWithTransactionCount_Request {
  date: Date;
}

export class FinancialCategory_GetWithTransactionCount_Response extends OmitType(
  FinancialCategoryEntity,
  [],
) {
  totalAmount: number;
}
