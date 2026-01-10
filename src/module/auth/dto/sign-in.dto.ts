import { OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { Profile } from "src/module/profile/_entities/profile.entity";

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserFilteredProfileDto extends OmitType(Profile, ["account"]) {}
export class SignInDtoResponse {
  accessToken: string;
  refreshToken: string;
  user?: UserFilteredProfileDto;
}
