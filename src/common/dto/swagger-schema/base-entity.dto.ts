import { ApiProperty } from "@nestjs/swagger";

// This entity will be used as a base for other entities

export class BaseEntityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt?: Date | null;
}
