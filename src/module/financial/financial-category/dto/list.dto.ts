import { IsDateString, IsOptional, IsString, Matches } from "class-validator";

export class FinancialCategory_GetList_Request {
  @IsString()
  @IsOptional()
  search?: string;

  @IsOptional()
  orderBy?: string = "createdAt";

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "month must be in YYYY-MM format",
  })
  amountMonth?: string;
}
