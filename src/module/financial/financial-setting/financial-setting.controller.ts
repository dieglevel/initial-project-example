import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialSettingService } from "./financial-setting.service";

@Controller("financial-setting")
@ApiBearerAuth("access-token")
export class FinancialSettingController {
  constructor(private readonly financialSettingService: FinancialSettingService) {}

}
