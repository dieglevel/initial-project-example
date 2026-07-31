import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialReportController } from "./financial-report.controller";
import { FinancialReportService } from "./financial-report.service";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialCategoryEntity } from "../financial-category/_entities/financial-category.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialTransactionEntity,
      FinancialWalletEntity,
      FinancialCategoryEntity,
    ]),
  ],
  controllers: [FinancialReportController],
  providers: [FinancialReportService],
  exports: [FinancialReportService],
})
export class FinancialReportModule {}
