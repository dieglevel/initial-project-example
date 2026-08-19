import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";
import type { FinancialDebtEntity } from "../_entities/financial-debt.entity";

export class FinancialDebt_Paging_Response extends BasePaginatedDto {
  items: FinancialDebtEntity[];
}
