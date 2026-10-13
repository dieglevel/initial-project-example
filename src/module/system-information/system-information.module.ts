import { Module } from "@nestjs/common";
import { SystemInformationService } from "./system-information.service";
import { SystemInformationController } from "./system-information.controller";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [],
  controllers: [SystemInformationController],
  providers: [SystemInformationService],
  exports: [SystemInformationService],
})
export class SystemInformationModule {}
