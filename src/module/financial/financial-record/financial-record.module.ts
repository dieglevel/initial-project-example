import { Module } from "@nestjs/common";
import { FinancialRecordService } from "./financial-record.service";
import { FinancialRecordController } from "./financial-record.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialRecordEntity } from "./_entities/financial-record.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialRecordEntity])],
  controllers: [FinancialRecordController],
  providers: [FinancialRecordService],
  exports: [FinancialRecordService],
})
export class FinancialRecordModule {}
