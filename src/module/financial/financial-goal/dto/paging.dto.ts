import { BasePaginatedDto } from "@/common/dto/swagger-schema/base-paginated.dto";
import type { FinancialGoalEntity } from "../_entities/financial-goal.entity";

export class FinancialGoal_Paging_Response extends BasePaginatedDto {
  items: FinancialGoalEntity[];
}
