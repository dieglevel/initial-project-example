import { IsNotEmpty, IsString } from "class-validator";
import type { UserFilteredProfileDto } from "./sign-in.dto";
import type { AccountEntity } from "@/module/account/_entities/account.entity";

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshTokenDtoResponse {
  accessToken: string;
  refreshToken: string;
  user: UserFilteredProfileDto;
}
