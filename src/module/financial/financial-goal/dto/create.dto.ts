import { FinancialGoalEntity } from "../_entities/financial-goal.entity";
import { PartialType } from "@nestjs/swagger";

export class FinancialGoal_Create_Request extends PartialType(
  FinancialGoalEntity,
) {}

export class FinancialGoal_Create_Response extends FinancialGoalEntity {}
