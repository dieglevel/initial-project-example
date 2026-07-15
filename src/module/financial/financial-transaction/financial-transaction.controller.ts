/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
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
}
