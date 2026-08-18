import { Module } from "@nestjs/common";
import { FinancialSettingModule } from "./financial-setting/financial-setting.module";
import { FinancialCategoryModule } from "./financial-category/financial-category.module";
import { FinancialWalletModule } from "./financial-wallet/financial-wallet.module";
import { FinancialTransactionModule } from "./financial-transaction/financial-transaction.module";
import { FinancialWalletTransferModule } from "./financial-wallet-transfer/financial-wallet-transfer.module";
import { FinancialGoalModule } from "./financial-goal/financial-goal.module";
import { FinancialRecurringModule } from "./financial-recurring/financial-recurring.module";
import { FinancialNotificationModule } from "./financial-notification/financial-notification.module";
import { FinancialReportModule } from "./financial-report/financial-report.module";
import { FinancialTransactionItemEntity } from "./financial-transaction/_entities/financial-transaction-item.entity";
import { FinancialDashboardModule } from "./financial-dashboard/financial-dashboard.module";
import { FinancialRecordModule } from "./financial-record/financial-record.module";

@Module({
  imports: [
    FinancialSettingModule,
    FinancialCategoryModule,
    FinancialWalletModule,
    FinancialWalletTransferModule,
    FinancialTransactionModule,
    FinancialGoalModule,
    FinancialRecurringModule,
    FinancialNotificationModule,
    FinancialReportModule,
    FinancialDashboardModule,
    FinancialRecordModule,
  ],
  providers: [],
})
export class FinancialModule {}
