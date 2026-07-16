import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialCategoryService } from "./financial-category.service";
import { CreateGenericController } from "@/common/controller/base-crud.controller";
import { FinancialCategoryEntity } from "./_entities/financial-category.entity";
import {
  FinancialCategory_Create_Request,
  FinancialCategory_Create_Response,
} from "./dto/create.dto";

import { FinancialCategory_GetAll_Response } from "./dto/get-all.dto";
import { FinancialCategory_Paging_Response } from "./dto/paging.dto";
import {
  FinancialCategory_Update_Request,
  FinancialCategory_Update_Response,
} from "./dto/update.dto";
import { FinancialCategory_Delete_Response } from "./dto/delete.dto";
import {
  FinancialCategory_GetWithTransactionCount_Response,
  type FinancialCategory_GetWithTransactionCount_Request,
} from "./dto/get-with-transaction-count.dto";

@Controller("financial-category")
@ApiBearerAuth("access-token")
export class FinancialCategoryController extends CreateGenericController<
  FinancialCategoryEntity,
  FinancialCategory_Create_Request,
  FinancialCategory_Update_Request
>({
  entity: FinancialCategoryEntity,
  dto: {
    create: FinancialCategory_Create_Request,
    update: FinancialCategory_Update_Request,
  },
  responses: {
    getAll: FinancialCategory_GetAll_Response,
    create: FinancialCategory_Create_Response,
    paging: FinancialCategory_Paging_Response,
    update: FinancialCategory_Update_Response,
    delete: FinancialCategory_Delete_Response,
  },
  excludeSearch: [],
}) {
  constructor(
    private readonly financialCategoryService: FinancialCategoryService,
  ) {
    super(financialCategoryService);
  }

  @Get("/with-transaction-count")
  @HttpCode(200)
  @ApiBaseResponse(FinancialCategory_GetWithTransactionCount_Response, {
    isArray: true,
  })
  async getsFinancialCategoryWithTransactionCount(@Query("date") date: Date) {
    return this.financialCategoryService.getCategoriesWithTotals({
      date: date,
    });
  }
}
