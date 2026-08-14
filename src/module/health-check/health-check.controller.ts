import { Controller, Get, HttpCode } from "@nestjs/common";
import { Public } from "../auth/decorator/public.decorator";

@Controller("health-check")
@Public()
export class HealthCheckController {
  constructor() {}

  @Get()
  @HttpCode(200)
  async healthCheck() {
    return { status: "OK" };
  }
}
