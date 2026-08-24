import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialWalletService } from "./financial-wallet.service";
import { CreateGenericController } from "@/common/controller/base-crud.controller";
import { FinancialWalletEntity } from "./_entities/financial-wallet.entity";
import {
  FinancialWallet_Create_Request,
  FinancialWallet_Create_Response,
} from "./dto/create.dto";
import {
  FinancialWallet_Update_Request,
  FinancialWallet_Update_Response,
} from "./dto/update.dto";
import { FinancialWallet_GetAll_Response } from "./dto/get-all.dto";
import { FinancialWallet_Paging_Response } from "./dto/paging.dto";
import { FinancialWallet_Delete_Response } from "./dto/delete.dto";
import { FinancialWallet_GetWithTransactionCount_Response } from "./dto/get-with-transaction-count.dto";
import {
  FinancialWallet_Transfer_Response,
  FinancialWallet_Transfer_Request,
} from "./dto/transfer.dto";

@Controller("financial-wallet")
@ApiBearerAuth("access-token")
export class FinancialWalletController extends CreateGenericController({
  entity: FinancialWalletEntity,
  dto: {
    create: FinancialWallet_Create_Request,
    update: FinancialWallet_Update_Request,
  },
  responses: {
    getAll: FinancialWallet_GetAll_Response,
    create: FinancialWallet_Create_Response,
    paging: FinancialWallet_Paging_Response,
    update: FinancialWallet_Update_Response,
    delete: FinancialWallet_Delete_Response,
  },
  excludeSearch: [],
}) {
  constructor(private readonly financialWalletService: FinancialWalletService) {
    super(financialWalletService);
  }

  @Get("/with-transaction-count")
  @HttpCode(200)
  @ApiBaseResponse(FinancialWallet_GetWithTransactionCount_Response, {
    isArray: true,
  })
  async getsFinancialWalletWithTransactionCount() {
    return this.financialWalletService.getWalletsWithTotals();
  }

  @Post("/transfer")
  @HttpCode(200)
  @ApiBaseResponse(FinancialWallet_Transfer_Response)
  async transferBetweenWallets(
    @Body() transferData: FinancialWallet_Transfer_Request,
  ) {
    return this.financialWalletService.transferBetweenWallets(transferData);
  }

  @Post("/:id/api-key")
  @HttpCode(200)
  async generateApiKey(@Param("id", ParseIntPipe) id: number) {
    return this.financialWalletService.generateApiKey(id);
  }
}
