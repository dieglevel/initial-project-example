import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialWalletTransferService } from "./financial-wallet-transfer.service";
import { FinancialWalletTransferEntity } from "./_entities/financial-wallet-transfer.entity";
import { FinancialWalletTransfer_Get_Response } from "./dto/get.dto";

@Controller("financial-wallet-transfer")
@ApiBearerAuth("access-token")
export class FinancialWalletTransferController {
  constructor(
    private readonly financialWalletTransferService: FinancialWalletTransferService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiBaseResponse(FinancialWalletTransfer_Get_Response)
  async getWalletTransferHistory(
    @Query("date") date: Date,
  ): Promise<FinancialWalletTransfer_Get_Response[]> {
    return await this.financialWalletTransferService.getWalletTransferHistory(
      date,
    );
  }
}
