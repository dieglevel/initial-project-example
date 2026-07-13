import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialTransactionService } from "./financial-transaction.service";

@Controller("financial-transaction")
@ApiBearerAuth("access-token")
export class FinancialTransactionController {
  constructor(private readonly financialTransactionService: FinancialTransactionService) {}

}
