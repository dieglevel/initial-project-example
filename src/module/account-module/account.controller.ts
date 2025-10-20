import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "src/common/decorator/api-swagger/api-base-response.decorator";
import { Account } from "./_entities/account.entity";
import { CreateAccountDto } from "./dto/create-account.dto";
import { AccountService } from "./account.service";

@Controller("account")
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post("register")
  @ApiBaseResponse(Account)
  async createAccount(@Body() body: CreateAccountDto) {
    return this.accountService.createAccount(body);
  }
}
