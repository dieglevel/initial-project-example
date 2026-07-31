import { FinancialGoalEntity } from "../_entities/financial-goal.entity";
import { PartialType } from "@nestjs/swagger/dist/type-helpers/partial-type.helper";

export class FinancialGoal_Update_Request extends PartialType(
  FinancialGoalEntity,
) {}

export class FinancialGoal_Update_Response extends FinancialGoalEntity {}
