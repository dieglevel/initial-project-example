import { Body, Controller, Get, HttpCode, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialSettingService } from "./financial-setting.service";
import { CurrentUser } from "@/module/auth/decorator/current-user.decorator";
import {
  FinancialSetting_Update_Request,
  FinancialSetting_Update_Response,
} from "./dto/update.dto";
import { JwtPayload } from "@/module/auth/payload.type";
import { FinancialSetting_Get_Response } from "./dto/get.dto";

@Controller("financial-setting")
@ApiBearerAuth("access-token")
export class FinancialSettingController {
  constructor(
    private readonly financialSettingService: FinancialSettingService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiBaseResponse(FinancialSetting_Get_Response)
  async getFinancialSetting(@CurrentUser() user: JwtPayload) {
    return this.financialSettingService.getFinancialSettingByUserId(user.sub);
  }

  @Patch()
  @HttpCode(200)
  @ApiBaseResponse(FinancialSetting_Update_Response)
  async updateFinancialSetting(
    @CurrentUser() user: JwtPayload,
    @Body() updateData: FinancialSetting_Update_Request,
  ) {
    return this.financialSettingService.updateFinancialSetting(
      user.sub,
      updateData,
    );
  }
}
