import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class BasePaginatedDto {
  @ApiProperty({ description: "Total number of items" })
  total: number;

  @ApiProperty({ description: "Total number of pages" })
  totalPages: number;

  @ApiProperty({ description: "Current page" })
  page: number;

  @ApiProperty({ description: "Number of items per page" })
  limit: number;
}
