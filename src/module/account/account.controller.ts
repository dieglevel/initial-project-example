import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { AccountService } from "./account.service";
import { RegisterDtoRequest, RegisterDtoResponse } from "./dto/register.dto";

@Controller("account")
@ApiBearerAuth("access-token")
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post("register")
  @HttpCode(200)
  @ApiBaseResponse(RegisterDtoResponse)
  async createAccount(@Body() body: RegisterDtoRequest) {
    return this.accountService.register(body);
  }
}
