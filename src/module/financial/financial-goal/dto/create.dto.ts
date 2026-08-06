import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDate,
  Min,
  Max,
  ValidateIf,
  IsNotEmpty,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import {
  FINANCIAL_GOAL_SAVING_MODE,
  FINANCIAL_GOAL_STATUS,
  FINANCIAL_GOAL_TYPE,
} from "../financial-goal.enum";

export class CreateFinancialGoalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  isLocked: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsEnum(FINANCIAL_GOAL_STATUS)
  status: FINANCIAL_GOAL_STATUS;

  @IsEnum(FINANCIAL_GOAL_TYPE)
  @IsOptional()
  type?: FINANCIAL_GOAL_TYPE;

  @IsNumber()
  @Min(1)
  targetAmount: number;

  @Type(() => Date)
  @IsDate()
  deadline: Date;

  @IsEnum(FINANCIAL_GOAL_SAVING_MODE)
  savingMode: FINANCIAL_GOAL_SAVING_MODE;

  @ValidateIf(
    (o: CreateFinancialGoalDto) =>
      o.savingMode === FINANCIAL_GOAL_SAVING_MODE.AUTO,
  )
  @IsNumber()
  @Min(1)
  autoContributionAmount?: number;

  @ValidateIf(
    (o: CreateFinancialGoalDto) =>
      o.savingMode === FINANCIAL_GOAL_SAVING_MODE.AUTO,
  )
  @Min(1)
  @Max(31)
  autoContributionDay?: number;
}

export class AddManualContributionDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  period?: string;
}

export class FinancialGoal_Create_Request extends CreateFinancialGoalDto {}
export class FinancialGoal_Create_Response {}
