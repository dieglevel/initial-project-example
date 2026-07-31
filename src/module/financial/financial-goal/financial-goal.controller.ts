import { Controller, Get, HttpCode, Param, Query } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { CreateGenericController } from "@/common/controller/base-crud.controller";
import { FinancialGoalEntity } from "./_entities/financial-goal.entity";
import {
  FinancialGoal_Create_Request,
  FinancialGoal_Create_Response,
} from "./dto/create.dto";
import {
  FinancialGoal_Update_Request,
  FinancialGoal_Update_Response,
} from "./dto/update.dto";
import { FinancialGoal_GetAll_Response } from "./dto/get-all.dto";
import { FinancialGoal_Paging_Response } from "./dto/paging.dto";
import { FinancialGoal_Delete_Response } from "./dto/delete.dto";
import {
  FinancialGoal_Projection_Request,
  FinancialGoal_Projection_Response,
} from "./dto/projection.dto";
import { FinancialGoalService } from "./financial-goal.service";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";

@Controller("financial-goal")
@ApiBearerAuth("access-token")
export class FinancialGoalController extends CreateGenericController({
  entity: FinancialGoalEntity,
  dto: {
    create: FinancialGoal_Create_Request,
    update: FinancialGoal_Update_Request,
  },
  responses: {
    getAll: FinancialGoal_GetAll_Response,
    create: FinancialGoal_Create_Response,
    paging: FinancialGoal_Paging_Response,
    update: FinancialGoal_Update_Response,
    delete: FinancialGoal_Delete_Response,
  },
  excludeSearch: [],
}) {
  constructor(private readonly financialGoalService: FinancialGoalService) {
    super(financialGoalService);
  }

  @Get(":id/projection")
  @HttpCode(200)
  @ApiBaseResponse(FinancialGoal_Projection_Response)
  async getProjection(
    @Param("id") id: number,
    @Query() query: FinancialGoal_Projection_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.getProjection(Number(id), query, user);
  }
}
