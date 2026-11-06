import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { ApiPagination } from "@/common/decorator/pagination/api-pagination.decorator";
import { Pagination } from "@/common/decorator/pagination/pagination.decorator";
import type { PaginationQuery } from "@/common/dto/interface/pagination.interface";

import { FinancialGoalService } from "./financial-goal.service";
import { FinancialGoalEntity } from "./_entities/financial-goal.entity";

import {
  FinancialGoal_Create_Request,
  FinancialGoal_Create_Response,
  AddManualContributionDto,
  CancelGoalDto,
  WithdrawFromGoalDto,
} from "./dto/create.dto";

import {
  FinancialGoal_Update_Request,
  FinancialGoal_Update_Response,
  CompleteAutoContributionDto,
} from "./dto/update.dto";

import { FinancialGoal_GetAll_Response } from "./dto/get-all.dto";
import { FinancialGoal_Paging_Response } from "./dto/paging.dto";
import { FinancialGoal_Delete_Response } from "./dto/delete.dto";
import {
  FinancialGoal_Projection_Request,
  FinancialGoal_Projection_Response,
} from "./dto/projection.dto";

/** Bảo vệ khi route bị gọi mà không có user (không xảy ra với AuthGuard toàn cục) */
const requireUser = (user?: JwtPayload): JwtPayload => {
  if (!user) throw new NotFoundException();
  return user;
};

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

  // ───────── Ghi đè route generic để chỉ thao tác trên mục tiêu của user ─────────
  // (Cùng tên method với base controller → thay thế route của base)

  @Get("paging")
  @HttpCode(HttpStatus.OK)
  @ApiBaseResponse(FinancialGoal_Paging_Response)
  @ApiPagination(FinancialGoalEntity, { excludeSearch: [], excludeOrder: [] })
  override async getPaging(
    @Pagination() pagination: PaginationQuery<FinancialGoalEntity>,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.financialGoalService.pagingForUser(
      pagination,
      requireUser(user).sub,
    );
  }

  @Post("/update/:id")
  @HttpCode(HttpStatus.OK)
  @ApiBaseResponse(FinancialGoal_Update_Response)
  override async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: FinancialGoal_Update_Request,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.financialGoalService.updateForUser(
      id,
      requireUser(user).sub,
      body,
    );
  }

  @Delete("/delete/:id")
  @HttpCode(HttpStatus.OK)
  @ApiBaseResponse(FinancialGoal_Delete_Response)
  override async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.financialGoalService.deleteForUser(id, requireUser(user).sub);
  }

  // ───────── Đọc ─────────

  @Get(":id/detail")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get financial goal detail (histories newest first)",
  })
  async getDetail(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.getDetail(id, user.sub);
  }

  @Get(":id/projection")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Estimate goal completion" })
  @ApiBaseResponse(FinancialGoal_Projection_Response)
  async getProjection(
    @Param("id", ParseIntPipe) id: number,
    @Query() query: FinancialGoal_Projection_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.getProjection(id, query, user);
  }

  @Get("wallet-balance-apply-goal")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get wallet balance apply goal" })
  async walletBalanceApplyGoal(@CurrentUser() user: JwtPayload) {
    return this.financialGoalService.walletBalanceApplyGoal(user);
  }

  // ───────── Góp / rút ─────────

  @Post(":id/manual-contribution")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Add manual contribution (walletId → deduct from wallet)",
  })
  async addManualContribution(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddManualContributionDto,
  ) {
    return this.financialGoalService.addManualContribution(id, user.sub, dto);
  }

  @Post(":id/withdraw")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Withdraw from goal (walletId → add to wallet). Blocked if locked",
  })
  async withdraw(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: WithdrawFromGoalDto,
  ) {
    return this.financialGoalService.withdraw(id, user.sub, dto);
  }

  @Post("history/:historyId/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm pending auto contribution" })
  async completePendingHistory(
    @Param("historyId", ParseIntPipe) historyId: number,
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
  @ApiOperation({ summary: "Skip pending auto contribution" })
  async skipHistory(
    @Param("historyId", ParseIntPipe) historyId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.skipHistory(historyId, user.sub);
  }

  // ───────── Vòng đời ─────────

  @Patch(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel goal (optional refundWalletId to return saved money)",
  })
  async cancelGoal(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CancelGoalDto,
  ) {
    return this.financialGoalService.cancelGoal(id, user.sub, dto ?? {});
  }

  @Patch(":id/pause")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Pause goal (ACTIVE → INACTIVE)" })
  async pauseGoal(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.pauseGoal(id, user.sub);
  }

  @Patch(":id/resume")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resume paused goal (INACTIVE → ACTIVE)" })
  async resumeGoal(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialGoalService.resumeGoal(id, user.sub);
  }
}
