import { Module } from "@nestjs/common";
import { FinancialSettingService } from "./financial-setting.service";
import { FinancialSettingController } from "./financial-setting.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialSettingEntity } from "./_entities/financial-setting.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialSettingEntity])],
  controllers: [FinancialSettingController],
  providers: [FinancialSettingService],
  exports: [FinancialSettingService],
})
export class FinancialSettingModule {}
