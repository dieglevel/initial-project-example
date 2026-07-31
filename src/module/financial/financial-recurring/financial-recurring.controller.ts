import { Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { CreateGenericController } from "@/common/controller/base-crud.controller";
import { FinancialRecurringEntity } from "./_entities/financial-recurring.entity";
import {
  FinancialRecurring_Create_Request,
  FinancialRecurring_Create_Response,
} from "./dto/create.dto";
import {
  FinancialRecurring_Update_Request,
  FinancialRecurring_Update_Response,
} from "./dto/update.dto";
import { FinancialRecurring_GetAll_Response } from "./dto/get-all.dto";
import { FinancialRecurring_Paging_Response } from "./dto/paging.dto";
import { FinancialRecurring_Delete_Response } from "./dto/delete.dto";
import { FinancialRecurringService } from "./financial-recurring.service";
import { FinancialRecurring_RunDue_Response } from "./dto/run-due.dto";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";

@Controller("financial-recurring")
@ApiBearerAuth("access-token")
export class FinancialRecurringController extends CreateGenericController({
  entity: FinancialRecurringEntity,
  dto: {
    create: FinancialRecurring_Create_Request,
    update: FinancialRecurring_Update_Request,
  },
  responses: {
    getAll: FinancialRecurring_GetAll_Response,
    create: FinancialRecurring_Create_Response,
    paging: FinancialRecurring_Paging_Response,
    update: FinancialRecurring_Update_Response,
    delete: FinancialRecurring_Delete_Response,
  },
  excludeSearch: [],
}) {
  constructor(private readonly recurringService: FinancialRecurringService) {
    super(recurringService);
  }

  @Post("/run-due")
  @HttpCode(200)
  @ApiBaseResponse(FinancialRecurring_RunDue_Response)
  async runDue(@CurrentUser() user: JwtPayload) {
    return this.recurringService.runDueForAccount(user);
  }
}
