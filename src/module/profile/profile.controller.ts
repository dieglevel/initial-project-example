import { Body, Controller, Get, HttpCode, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { ProfileService } from "./profile.service";
import { MeDtoResponse } from "./dto/me.dto";
import { CurrentUser } from "../auth/decorator/current-user.decorator";
import { JwtPayload } from "../auth/payload.type";
import { Profile_Update_Request } from "./dto/update.dto";

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

  @Post()
  @HttpCode(200)
  @ApiBaseResponse(MeDtoResponse)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateData: Profile_Update_Request,
  ): Promise<MeDtoResponse> {
    return this.profileService.updateProfile(user.sub, updateData);
  }
}
