import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialWalletTransferService } from "./financial-wallet-transfer.service";

@Controller("financial-wallet-transfer")
@ApiBearerAuth("access-token")
export class FinancialWalletTransferController {
  constructor(
    private readonly financialWalletTransferService: FinancialWalletTransferService,
  ) {}
}
