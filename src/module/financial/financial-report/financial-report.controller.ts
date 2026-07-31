import { Controller, Get, HttpCode, Query } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialReportService } from "./financial-report.service";
import { FinancialReport_Query_Request } from "./dto/query.dto";
import { FinancialReport_CashFlow_Response } from "./dto/cash-flow.dto";
import { FinancialReport_SpendingAnalysis_Response } from "./dto/spending-analysis.dto";
import { FinancialReport_NetWorth_Response } from "./dto/net-worth.dto";
import { FinancialReport_BudgetPerformance_Response } from "./dto/budget-performance.dto";

@Controller("financial-report")
@ApiBearerAuth("access-token")
export class FinancialReportController {
  constructor(
    private readonly financialReportService: FinancialReportService,
  ) {}

  @Get("/cash-flow")
  @HttpCode(200)
  @ApiBaseResponse(FinancialReport_CashFlow_Response)
  async getCashFlow(
    @Query() query: FinancialReport_Query_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialReportService.getCashFlow(query, user);
  }

  @Get("/spending-analysis")
  @HttpCode(200)
  @ApiBaseResponse(FinancialReport_SpendingAnalysis_Response)
  async getSpendingAnalysis(
    @Query() query: FinancialReport_Query_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialReportService.getSpendingAnalysis(query, user);
  }

  @Get("/net-worth")
  @HttpCode(200)
  @ApiBaseResponse(FinancialReport_NetWorth_Response)
  async getNetWorth(
    @Query() query: FinancialReport_Query_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialReportService.getNetWorth(query, user);
  }

  @Get("/budget-performance")
  @HttpCode(200)
  @ApiBaseResponse(FinancialReport_BudgetPerformance_Response)
  async getBudgetPerformance(
    @Query() query: FinancialReport_Query_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.financialReportService.getBudgetPerformance(query, user);
  }
}
