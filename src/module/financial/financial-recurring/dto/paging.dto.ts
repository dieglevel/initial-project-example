import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";
import type { FinancialRecurringEntity } from "../_entities/financial-recurring.entity";

export class FinancialRecurring_Paging_Response extends BasePaginatedDto {
  items: FinancialRecurringEntity[];
}
