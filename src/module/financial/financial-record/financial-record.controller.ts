import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { FinancialRecordService } from "./financial-record.service";
import { Public } from "@/module/auth/decorator/public.decorator";
import type { FinancialRecordDTO } from "./dto/record.dto";

@Controller("financial-record")
@ApiBearerAuth("access-token")
export class FinancialRecordController {
  constructor(
    private readonly financialRecordService: FinancialRecordService,
  ) {}

  @Public()
  @Post("record")
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Endpoint để điện thoại (Notification Listener) bắn dữ liệu thông báo ngân hàng lên server",
  })
  async createFinancialRecord(
    @Body() body: FinancialRecordDTO,
    @Headers("x-api-key") headerApiKey?: string,
  ) {
    return this.financialRecordService.processIncomingRecord(
      body,
      headerApiKey,
    );
  }

  @Public()
  @Post("record/:apiKey")
  @HttpCode(200)
  @ApiOperation({
    summary: "Endpoint hỗ trợ truyền apiKey trực tiếp trên URL path",
  })
  async createFinancialRecordWithApiKey(
    @Param("apiKey") apiKey: string,
    @Body() body: FinancialRecordDTO,
  ) {
    const payload = { ...body, apiKey };
    return this.financialRecordService.processIncomingRecord(payload);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: "Lấy danh sách các bản ghi record vừa bắn lên" })
  async getRecords() {
    return this.financialRecordService.getAllRecords();
  }

  @Public()
  @Post("test-record")
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Endpoint để test thử nghiệm bắn dữ liệu thông báo ngân hàng lên server",
  })
  async testFinancialRecord(
    @Body() body: FinancialRecordDTO,
    @Headers("x-api-key") headerApiKey?: string,
  ) {
    return this.financialRecordService.processIncomingRecord(
      body,
      headerApiKey,
    );
  }
}
