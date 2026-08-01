import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialAdvanceTransactionService } from "./financial-advance-transaction.service";
import { FinancialAdvanceTransaction_Create_Request } from "./dto/create.dto";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";

@Controller("financial-advance-transactions")
@ApiBearerAuth("access-token")
export class FinancialAdvanceTransactionController {
  constructor(
    private readonly financialAdvanceTransactionService: FinancialAdvanceTransactionService,
  ) {}

  @Post("create")
  @HttpCode(200)
  async createAdvanceTransaction(
    @Body() dto: FinancialAdvanceTransaction_Create_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    console.log(" DTO in Controller:", JSON.stringify(dto));
    return this.financialAdvanceTransactionService.createAdvanceTransaction(
      dto,
      user,
    );
  }
}
