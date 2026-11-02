import { Type } from "class-transformer";
import { IsNumber, Min } from "class-validator";

export class FinancialIncomePlan_Upsert_Request {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  expectedAmount: number;
}
