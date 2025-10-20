import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import {} from "./dto/request.dto";
import { TempResponse } from "./dto/response.dto";
import { AccountService } from "./account.service";

@Controller("account")
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post("register")
  @HttpCode(200)
  @ApiBaseResponse(TempResponse)
  async registerAccount(@Body() body: any) {
    return null;
  }
}
