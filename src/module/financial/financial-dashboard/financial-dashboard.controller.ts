import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialDashboardService } from "./financial-dashboard.service";

@Controller("financial-dashboard")
@ApiBearerAuth("access-token")
export class FinancialDashboardController {
  constructor(
    private readonly financialDashboardService: FinancialDashboardService,
  ) {}
}
