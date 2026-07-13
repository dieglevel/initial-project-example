import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";
import type { FinancialCategoryEntity } from "../_entities/financial-category.entity";

export class FinancialCategory_Paging_Response extends BasePaginatedDto {
  items: FinancialCategoryEntity[];
}
