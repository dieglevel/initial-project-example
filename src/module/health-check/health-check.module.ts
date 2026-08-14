import { Module } from "@nestjs/common";
import { HealthCheckController } from "./health-check.controller";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [],
  controllers: [HealthCheckController],
  providers: [],
  exports: [],
})
export class HealthCheckModule {}
