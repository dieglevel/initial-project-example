import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialTransactionService } from "./financial-transaction.service";
import {
  FinancialTransaction_Create_Request,
  FinancialTransaction_Create_Response,
} from "./dto/create.dto";
import {
  FinancialTransaction_Update_Request,
  FinancialTransaction_Update_Response,
} from "./dto/update.dto";
import { FinancialTransaction_GetAll_Response } from "./dto/get-all.dto";
import { FinancialTransaction_Paging_Response } from "./dto/paging.dto";
import { FinancialTransaction_Delete_Response } from "./dto/delete.dto";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";
import { CreateGenericController } from "@/common/controller/base-crud.controller";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";

@Controller("financial-transaction")
@ApiBearerAuth("access-token")
export class FinancialTransactionController extends CreateGenericController({
  entity: FinancialTransactionEntity,
  dto: {
    create: FinancialTransaction_Create_Request,
    update: FinancialTransaction_Update_Request,
  },
  responses: {
    getAll: FinancialTransaction_GetAll_Response,
    create: FinancialTransaction_Create_Response,
    paging: FinancialTransaction_Paging_Response,
    update: FinancialTransaction_Update_Response,
    delete: FinancialTransaction_Delete_Response,
  },
  excludeSearch: [],
}) {
  constructor(
    private readonly financialTransactionService: FinancialTransactionService,
  ) {
    super(financialTransactionService);
  }

  @Get("/get-with-date")
  @HttpCode(200)
  @ApiBaseResponse(FinancialTransaction_GetAll_Response, { isArray: true })
  async getWithDate(@Query("date") date: Date) {
    return this.financialTransactionService.getByDate({
      date: date,
    });
  }

  @Post("/create")
  @HttpCode(200)
  @ApiBaseResponse(FinancialTransaction_Create_Response)
  async createOverride(
    @Body() dto: FinancialTransaction_Create_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialTransactionService.createOverride(dto, user);
  }
}
