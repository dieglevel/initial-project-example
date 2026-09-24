import { IsOptional, IsString, Matches } from "class-validator";
import { FinancialTransactionItemEntity } from "../../financial-transaction/_entities/financial-transaction-item.entity";
import { FinancialCategoryEntity } from "../_entities/financial-category.entity";

export class FinancialCategory_GetTransactionCategory_Request {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "month must be in YYYY-MM format",
  })
  amountMonth?: string;
}

export class FinancialCategory_GetTransactionCategory_Response {
  parent: Omit<FinancialCategoryEntity, "children" | "transactionItems">;
  children: FinancialCategoryEntity[];
  transactionItems: (Omit<FinancialTransactionItemEntity, "category"> & {
    category: Partial<FinancialCategoryEntity>;
  })[];
}
