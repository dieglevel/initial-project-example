import { FinancialCategoryEntity } from "../_entities/financial-category.entity";
export class FinancialCategory_GetWithTransactionCount_Request {
  date: Date;
}

export class FinancialCategory_GetWithTransactionCount_Response extends FinancialCategoryEntity {
  totalAmount: number;
}
