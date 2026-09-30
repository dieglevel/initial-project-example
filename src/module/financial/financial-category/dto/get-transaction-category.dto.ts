import { IsOptional, IsString, Matches } from "class-validator";
import { FinancialTransactionItemEntity } from "../../financial-transaction/_entities/financial-transaction-item.entity";
import { FinancialCategoryEntity } from "../_entities/financial-category.entity";
import dayjs from "dayjs";

export class FinancialCategory_GetTransactionCategory_Request {
  @IsOptional()
  @IsString()
  startDate?: dayjs.Dayjs | string | Date;

  @IsOptional()
  @IsString()
  endDate?: dayjs.Dayjs | string | Date;
}

export class FinancialCategory_GetTransactionCategory_Response {
  parent: Omit<FinancialCategoryEntity, "children" | "transactionItems">;
  children: FinancialCategoryEntity[];
  transactionItems: (Omit<FinancialTransactionItemEntity, "category"> & {
    category: Partial<FinancialCategoryEntity>;
  })[];
  overcomeTransactionItems: (Omit<
    FinancialTransactionItemEntity,
    "category"
  > & {
    category: Partial<FinancialCategoryEntity>;
  })[];
}
