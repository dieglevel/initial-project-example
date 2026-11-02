import { Type } from "class-transformer";
import {
  IsDateString,
  IsNumber,
  IsOptional,
  Matches,
  Min,
} from "class-validator";

export class FinancialCategory_Budget_Request {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  amount: number | null;
}

export class FinancialCategory_Budget_Response {
  categoryId: number;
  month: string;
  amount: number | null;
}
