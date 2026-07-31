import { OmitType } from "@nestjs/swagger";
import { FinancialGoalEntity } from "../_entities/financial-goal.entity";

export class FinancialGoal_GetAll_Response extends OmitType(
  FinancialGoalEntity,
  [],
) {}
