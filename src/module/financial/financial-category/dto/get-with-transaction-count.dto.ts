import { FinancialCategoryEntity } from "../_entities/financial-category.entity";
export class FinancialCategory_GetWithTransactionCount_Request {
  date: Date;
}

export class FinancialCategory_GetWithTransactionCount_Response extends FinancialCategoryEntity {
  totalAmount: number;
  remaining?: number | null;
  percent?: number | null;
  status?: "ok" | "warn" | "danger" | "over" | "free";
  allocatedToChildren?: number;
  unallocated?: number | null;
  overAllocated?: boolean;
}
