import { Body, Controller, Get, HttpCode, Param, Put } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialIncomePlanEntity } from "./_entities/financial-income-plan.entity";
import { FinancialIncomePlanService } from "./financial-income-plan.service";
import { FinancialIncomePlan_Upsert_Request } from "./dto/income-plan.dto";

@Controller("financial-income-plan")
@ApiBearerAuth("access-token")
export class FinancialIncomePlanController {
  constructor(private readonly service: FinancialIncomePlanService) {}

  @Get(":month")
  @HttpCode(200)
  @ApiBaseResponse(FinancialIncomePlanEntity)
  get(@Param("month") month: string, @CurrentUser() user: JwtPayload) {
    return this.service.get(month, user);
  }

  @Put(":month")
  @HttpCode(200)
  @ApiBaseResponse(FinancialIncomePlanEntity)
  upsert(
    @Param("month") month: string,
    @Body() body: FinancialIncomePlan_Upsert_Request,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.upsert(month, body, user);
  }
}
