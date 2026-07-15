import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";
import type { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";

export class FinancialTransaction_Paging_Response extends BasePaginatedDto {
  items: FinancialTransactionEntity[];
}
