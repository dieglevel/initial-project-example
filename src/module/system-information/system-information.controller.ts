import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ApiBaseResponse } from "@/common/decorator/api-swagger/api-base-response.decorator";
import { SystemInformationService } from "./system-information.service";
import { Public } from "../auth/decorator/public.decorator";

@Public()
@Controller("system-information")
export class SystemInformationController {
  constructor(
    private readonly systemInformationService: SystemInformationService,
  ) {}

  @Get()
  getMetrics() {
    return this.systemInformationService.getMetrics();
  }
}
