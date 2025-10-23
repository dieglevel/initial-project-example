import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { AuthService } from "./auth.service";
import { SignInDto, SignInDtoResponse } from "./dto/sign-in.dto";
import { MeDtoResponse } from "./dto/me.dto";
import { AccountService } from "./account.service";
import { CurrentUser } from "./decorator/current-user.decorator";
import { JwtPayload } from "./payload.type";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "./decorator/public.decorator";

@Controller("auth")
@ApiBearerAuth("access-token")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
  ) {}

  @Public()
  @Post("sign-in")
  @HttpCode(200)
  @ApiBaseResponse(SignInDtoResponse)
  async signIn(@Body() data: SignInDto) {
    return this.authService.signIn(data);
  }

  @Get("me")
  @HttpCode(200)
  @ApiBaseResponse(MeDtoResponse)
  async me(@CurrentUser() user: JwtPayload) {
    return this.accountService.me(user.sub);
  }
}
