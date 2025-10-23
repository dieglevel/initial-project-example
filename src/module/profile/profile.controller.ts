import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { ProfileService } from "./profile.service";
import { MeDtoResponse } from "./dto/me.dto";
import { CurrentUser } from "../auth/decorator/current-user.decorator";
import { JwtPayload } from "../auth/payload.type";

@Controller("profile")
@ApiBearerAuth("access-token")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get("me")
  @HttpCode(200)
  @ApiBaseResponse(MeDtoResponse)
  async me(@CurrentUser() user: JwtPayload): Promise<MeDtoResponse> {
    return this.profileService.me({ userId: user.sub });
  }
}
