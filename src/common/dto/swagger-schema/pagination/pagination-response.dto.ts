import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

@Expose()
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: "List of items",
    isArray: true,
    type: () => Object,
  })
  items: T[];

  @ApiProperty({ description: "Total number of items" })
  total: number;

  @ApiProperty({ description: "Total number of pages" })
  totalPages: number;

  @ApiProperty({ description: "Current page" })
  page: number;

  @ApiProperty({ description: "Number of items per page" })
  pageSize: number;
}
