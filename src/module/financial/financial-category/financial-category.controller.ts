import { Body, Controller, HttpCode, Post } from "@nestjs/common";
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

@Controller("financial-category")
@ApiBearerAuth("access-token")
export class FinancialCategoryController extends CreateGenericController({
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(financialCategoryService);
  }
}
