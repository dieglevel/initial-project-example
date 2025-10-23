import { IsNotEmpty, IsString } from "class-validator";

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SignInDtoResponse {
  accessToken: string;
}
