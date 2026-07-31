import { Module } from "@nestjs/common";
import { FinancialSettingModule } from "./financial-setting/financial-setting.module";
import { FinancialCategoryModule } from "./financial-category/financial-category.module";
import { FinancialWalletModule } from "./financial-wallet/financial-wallet.module";
import { FinancialTransactionModule } from "./financial-transaction/financial-transaction.module";
import { FinancialWalletTransferModule } from "./financial-wallet-transfer/financial-wallet-transfer.module";
import { FinancialAdvanceTransactionModule } from "./financial-transaction/financial-advance-transaction/financial-advance-transaction.module";
import { FinancialGoalModule } from "./financial-goal/financial-goal.module";
import { FinancialRecurringModule } from "./financial-recurring/financial-recurring.module";
import { FinancialNotificationModule } from "./financial-notification/financial-notification.module";
import { FinancialReportModule } from "./financial-report/financial-report.module";

@Module({
  imports: [
    FinancialSettingModule,
    FinancialCategoryModule,
    FinancialWalletModule,
    FinancialWalletTransferModule,
    FinancialTransactionModule,
    FinancialAdvanceTransactionModule,
    FinancialGoalModule,
    FinancialRecurringModule,
    FinancialNotificationModule,
    FinancialReportModule,
  ],
  providers: [],
})
export class FinancialModule {}
