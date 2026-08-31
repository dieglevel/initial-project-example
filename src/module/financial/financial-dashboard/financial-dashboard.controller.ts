import { Controller, Get, HttpCode, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialDashboardService } from "./financial-dashboard.service";
import {
  GetFinancialDashboard_Request,
  FinancialDashboard_Response,
} from "./dto/financial-dashboard.dto";

@Controller("financial-dashboard")
@ApiBearerAuth("access-token")
export class FinancialDashboardController {
  constructor(
    private readonly financialDashboardService: FinancialDashboardService,
  ) {}

  @Get("/summary")
  @HttpCode(200)
  @ApiOperation({ summary: "Lấy dữ liệu tổng quan tài chính (Dashboard Summary)" })
  @ApiBaseResponse(FinancialDashboard_Response)
  async getDashboardSummary(
    @Query() query: GetFinancialDashboard_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialDashboardService.getDashboardSummary({ query, user });
  }
}
