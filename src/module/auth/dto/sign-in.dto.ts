import { OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { ProfileEntity } from "@/module/profile/_entities/profile.entity";

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserFilteredProfileDto extends OmitType(ProfileEntity, [
  "account",
]) {}
export class SignInDtoResponse {
  accessToken: string;
  refreshToken: string;
  user?: UserFilteredProfileDto;
}
