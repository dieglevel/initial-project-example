import { ApiProperty } from "@nestjs/swagger";

export class BaseResponseDto<T> {
  @ApiProperty()
  path: string;

  @ApiProperty()
  timeStamp: Date;

  @ApiProperty()
  statusCode: number;

  @ApiProperty({ type: () => Object })
  data: T;
}
