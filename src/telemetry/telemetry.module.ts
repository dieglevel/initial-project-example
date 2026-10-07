import { Module } from "@nestjs/common";
import { OtelDashboardController } from "./otel-dashboard.controller";

@Module({ controllers: [OtelDashboardController] })
export class TelemetryModule {}
