import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { CreateGenericController } from "@/common/controller/base-crud.controller";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";

import { FinancialDebtService } from "./financial-debt.service";
import { FinancialDebtEntity } from "./_entities/financial-debt.entity";

// Import các DTO tương ứng (bạn có thể điều chỉnh đường dẫn file DTO cho đúng với project)
import {
  FinancialDebt_Create_Request,
  FinancialDebt_Create_Response,
} from "./dto/create.dto";
import { FinancialDebt_GetAll_Response } from "./dto/get-all.dto";
import { FinancialDebt_Paging_Response } from "./dto/paging.dto";
import {
  FinancialDebt_Update_Request,
  FinancialDebt_Update_Response,
} from "./dto/update.dto";
import { FinancialDebt_Delete_Response } from "./dto/delete.dto";
import {
  FinancialDebt_Payment_Request,
  FinancialDebt_Adjust_Request,
  FinancialDebt_Settle_Request,
  FinancialDebt_Cancel_Request,
} from "./dto/action.dto";
import { FinancialDebtHistory_GetAll_Response } from "./dto/get-history.dto";

@ApiTags("financial-debt")
@Controller("financial-debt")
@ApiBearerAuth("access-token")
export class FinancialDebtController extends CreateGenericController<
  FinancialDebtEntity,
  FinancialDebt_Create_Request,
  FinancialDebt_Update_Request
>({
  entity: FinancialDebtEntity,
  dto: {
    create: FinancialDebt_Create_Request,
    update: FinancialDebt_Update_Request,
  },
  responses: {
    getAll: FinancialDebt_GetAll_Response,
    create: FinancialDebt_Create_Response,
    paging: FinancialDebt_Paging_Response,
    update: FinancialDebt_Update_Response,
    delete: FinancialDebt_Delete_Response,
  },
  excludeSearch: [],
}) {
  constructor(private readonly financialDebtService: FinancialDebtService) {
    super(financialDebtService);
  }

  /**
   * Lấy danh sách khoản nợ của tài khoản
   */
  @Get("/my-debts")
  @HttpCode(200)
  @ApiBaseResponse(FinancialDebt_GetAll_Response, { isArray: true })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.financialDebtService.findAll(user.sub);
  }

  /**
   * Lấy chi tiết khoản nợ
   */
  @Get("/:id")
  @HttpCode(200)
  @ApiBaseResponse(FinancialDebt_Create_Response)
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialDebtService.findOne(id, user.sub);
  }

  /**
   * Thanh toán nợ (Trừ/Cộng tiền vào ví)
   */
  @Post("/:id/payment")
  @HttpCode(200)
  @ApiBaseResponse(FinancialDebt_Create_Response)
  async payment(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: FinancialDebt_Payment_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialDebtService.payment(
      id,
      user.sub,
      dto.walletId,
      dto.amount,
      dto.note,
    );
  }

  /**
   * Điều chỉnh số tiền nợ còn lại
   */
  @Post("/:id/adjust")
  @HttpCode(200)
  @ApiBaseResponse(FinancialDebt_Create_Response)
  async adjust(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: FinancialDebt_Adjust_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialDebtService.adjust(
      id,
      user.sub,
      dto.outstandingAmount,
      dto.note,
    );
  }

  /**
   * Tất toán khoản nợ (Thỏa thuận đóng nợ)
   */
  @Post("/:id/settle")
  @HttpCode(200)
  @ApiBaseResponse(FinancialDebt_Create_Response)
  async settle(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: FinancialDebt_Settle_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialDebtService.settle(id, user.sub, dto?.note);
  }

  /**
   * Hủy khoản nợ
   */
  @Post("/:id/cancel")
  @HttpCode(200)
  @ApiBaseResponse(FinancialDebt_Create_Response)
  async cancel(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: FinancialDebt_Cancel_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialDebtService.cancel(id, user.sub, dto?.note);
  }

  /**
   * Lấy biến động/lịch sử của khoản nợ
   */
  @Get("/:id/histories")
  @HttpCode(200)
  @ApiBaseResponse(FinancialDebtHistory_GetAll_Response, { isArray: true })
  async getHistories(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialDebtService.getHistories(id, user.sub);
  }
}
