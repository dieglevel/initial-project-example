import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialDashboardService } from "./financial-dashboard.service";
import { FinancialDashboardController } from "./financial-dashboard.controller";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FinancialTransactionItemEntity } from "../financial-transaction/_entities/financial-transaction-item.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialCategoryEntity } from "../financial-category/_entities/financial-category.entity";
import { FinancialGoalEntity } from "../financial-goal/_entities/financial-goal.entity";
import { FinancialDebtEntity } from "../financial-debt/_entities/financial-debt.entity";
import { FinancialSettingEntity } from "../financial-setting/_entities/financial-setting.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialTransactionEntity,
      FinancialTransactionItemEntity,
      FinancialWalletEntity,
      FinancialCategoryEntity,
      FinancialGoalEntity,
      FinancialDebtEntity,
      FinancialSettingEntity,
    ]),
  ],
  controllers: [FinancialDashboardController],
  providers: [FinancialDashboardService],
  exports: [FinancialDashboardService],
})
export class FinancialDashboardModule {}
