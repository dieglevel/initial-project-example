import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { AccountService } from "./account.service";
import { RegisterDtoRequest, RegisterDtoResponse } from "./dto/register.dto";
import {
  ChangePasswordDto,
  ChangePasswordDtoResponse,
} from "./dto/change-password.dto";
import { CurrentUser } from "../auth/decorator/current-user.decorator";
import { JwtPayload } from "../auth/payload.type";
import { Public } from "../auth/decorator/public.decorator";

@Controller("account")
@ApiBearerAuth("access-token")
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Public()
  @Post("register")
  @HttpCode(200)
  @ApiBaseResponse(RegisterDtoResponse)
  async register(@Body() body: RegisterDtoRequest) {
    return this.accountService.register(body);
  }

  @Post("change-password")
  @HttpCode(200)
  @ApiBaseResponse(ChangePasswordDtoResponse)
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: ChangePasswordDto,
  ) {
    return this.accountService.changePassword(user, body);
  }
}
