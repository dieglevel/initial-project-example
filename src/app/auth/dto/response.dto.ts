import { ApiProperty } from "@nestjs/swagger";

export class CreateAccount_ResponseDto {
  @ApiProperty({ example: "user@example.com" })
  email: string;

  @ApiProperty({ example: "1234567890" })
  phone: string;
}

export class GetSomething_ResponseDto {
  @ApiProperty({ example: "some data" })
  data: string;

  @ApiProperty({ example: "2023-10-01T00:00:00Z" })
  timestamp: string;
}
