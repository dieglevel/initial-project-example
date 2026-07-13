import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialWalletService } from "./financial-wallet.service";

@Controller("financial-wallet")
@ApiBearerAuth("access-token")
export class FinancialWalletController {
  constructor(private readonly financialWalletService: FinancialWalletService) {}

}
