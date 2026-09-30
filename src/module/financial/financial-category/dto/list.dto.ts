import { IsDateString, IsOptional, IsString, Matches } from "class-validator";

export class FinancialCategory_GetList_Request {
  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  orderBy?: string = "createdAt";

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
