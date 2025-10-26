import { IsNotEmpty, IsString } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ChangePasswordDtoResponse {
  success: boolean;
}
