import { PartialType } from "@nestjs/mapped-types";
import { CreateFinancialGoalDto } from "./create.dto";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UpdateFinancialGoalDto extends PartialType(
  CreateFinancialGoalDto,
) {}

export class CompleteAutoContributionDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;
}

// Aliases cho Swagger/Controller
export class FinancialGoal_Update_Request extends UpdateFinancialGoalDto {}
export class FinancialGoal_Update_Response {}
