import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshTokenDtoResponse {
  accessToken: string;
  refreshToken: string;
}
