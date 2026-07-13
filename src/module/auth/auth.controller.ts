import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./decorator/current-user.decorator";
import { Public } from "./decorator/public.decorator";
import { LogOutDtoResponse } from "./dto/log-out.dto";
import {
  RefreshTokenDto,
  RefreshTokenDtoResponse,
} from "./dto/refresh-token.dto";
import { SignInDto, SignInDtoResponse } from "./dto/sign-in.dto";
import { JwtPayload } from "./payload.type";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("sign-in")
  @HttpCode(200)
  @ApiBaseResponse(SignInDtoResponse)
  async signIn(@Body() data: SignInDto) {
    return this.authService.signIn(data);
  }

  @Post("log-out")
  @HttpCode(200)
  @ApiBearerAuth("access-token")
  @ApiBaseResponse(LogOutDtoResponse)
  async logOut(@CurrentUser() user: JwtPayload) {
    await this.authService.logOut({ userId: user.sub });
  }

  @Public()
  @Post("refresh-token")
  @HttpCode(200)
  @ApiBaseResponse(RefreshTokenDtoResponse)
  async refreshToken(@Body() data: RefreshTokenDto) {
    return this.authService.refreshToken(data);
  }
}
