import { Transform, Type } from "class-transformer";
import {
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Matches,
  IsEnum,
} from "class-validator";

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(100)
  limit = 10;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page = 1;

  @IsOptional()
  @IsString()
  sortBy?: string; // Tên cột muốn sắp xếp (VD: "name")

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.ASC;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}
