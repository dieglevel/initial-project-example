import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class BaseResponseDto<T> {
  @ApiProperty()
  path: string;

  @ApiProperty()
  timeStamp: Date;

  @ApiProperty()
  statusCode: number;

  @ApiPropertyOptional({ type: () => Object })
  data: T;
}
