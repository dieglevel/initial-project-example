import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class BasePaginatedDto {
  @ApiProperty({ description: "Total number of items" })
  totalItems: number;

  @ApiProperty({ description: "Total number of pages" })
  totalPages: number;

  @ApiProperty({ description: "Current page" })
  currentPage: number;

  @ApiProperty({ description: "Number of items per page" })
  itemsPerPage: number;
}
