import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { FinancialRecordService } from "./financial-record.service";
import { Public } from "@/module/auth/decorator/public.decorator";

@Public()
@Controller("financial-record")
@ApiBearerAuth("access-token")
export class FinancialRecordController {
  constructor(
    private readonly financialRecordService: FinancialRecordService,
  ) {}

  @Post("record")
  @HttpCode(200)
  async createFinancialRecord(
    @Body()
    body: any,
  ) {
    console.log("body", body);
    return this.financialRecordService.createFinancialRecord(body);
  }
}
