import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { CreateGenericController } from "@/common/controller/base-crud.controller";

import { FinancialGoalService } from "./financial-goal.service";
import { FinancialGoalEntity } from "./_entities/financial-goal.entity";
import { FinancialGoalHistoryEntity } from "./financial-goal-history/_entities/financial-goal-history.entity";
import { FINANCIAL_GOAL_STATUS } from "./financial-goal.enum";

import {
  FinancialGoal_Create_Request,
  FinancialGoal_Create_Response,
  AddManualContributionDto,
} from "./dto/create.dto";

import {
  FinancialGoal_Update_Request,
  FinancialGoal_Update_Response,
  CompleteAutoContributionDto,
} from "./dto/update.dto";

import { FinancialGoal_GetAll_Response } from "./dto/get-all.dto";
import { FinancialGoal_Paging_Response } from "./dto/paging.dto";
import { FinancialGoal_Delete_Response } from "./dto/delete.dto";
import { FinancialGoal_Projection_Response } from "./dto/projection.dto";
@ApiTags("Financial Goal")
@ApiBearerAuth("access-token")
@Controller("financial-goal")
export class FinancialGoalController extends CreateGenericController<
  FinancialGoalEntity,
  FinancialGoal_Create_Request,
  FinancialGoal_Update_Request
>({
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

  @Get(":id/detail")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get financial goal detail",
  })
  async getDetail(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.getDetail(id, user.sub);
  }

  @Get(":id/projection")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Estimate goal completion",
  })
  @ApiBaseResponse(FinancialGoal_Projection_Response)
  async getProjection(
    @Param("id", ParseIntPipe) id: number,
    @Query("monthlySavingRate") monthlySavingRate: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.getProjection(
      id,
      { monthlySavingRate },
      user,
    );
  }

  @Post(":id/manual-contribution")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Add manual contribution",
  })
  async addManualContribution(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddManualContributionDto,
  ) {
    return this.financialGoalService.addManualContribution(id, user.sub, dto);
  }

  @Post("history/:historyId/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Complete pending contribution",
  })
  async completePendingHistory(
    @Param("historyId", ParseIntPipe)
    historyId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CompleteAutoContributionDto,
  ) {
    return this.financialGoalService.completePendingHistory(
      historyId,
      user.sub,
      dto,
    );
  }

  @Post("history/:historyId/skip")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Skip pending contribution",
  })
  async skipHistory(
    @Param("historyId", ParseIntPipe)
    historyId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.skipHistory(historyId, user.sub);
  }

  @Patch(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel financial goal",
  })
  async cancelGoal(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.cancelGoal(id, user.sub);
  }
}
