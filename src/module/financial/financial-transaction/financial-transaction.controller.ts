import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
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
import {
  FinancialTransaction_Paging_Response,
  type FinancialTransaction_GetAll_Request,
} from "./dto/paging.dto";
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

  @Get("/get")
  @HttpCode(200)
  @ApiBaseResponse(FinancialTransaction_GetAll_Response, { isArray: true })
  async get(
    @Query() query: FinancialTransaction_GetAll_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialTransactionService.get({ query, user });
  }

  @Get("view/:id")
  @HttpCode(200)
  @ApiBaseResponse(FinancialTransaction_GetAll_Response)
  async view(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialTransactionService.view(id, user);
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

  @Post("/update/:id")
  @HttpCode(200)
  @ApiBaseResponse(FinancialTransaction_Update_Response)
  async updateOverride(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: FinancialTransaction_Update_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialTransactionService.updateOverride(id, dto, user);
  }

  @Delete("/delete/:id")
  @HttpCode(200)
  @ApiBaseResponse(FinancialTransaction_Delete_Response)
  async deleteOverride(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialTransactionService.deleteOverride(id, user);
  }
}
