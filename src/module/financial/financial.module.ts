import { Module } from "@nestjs/common";
import { FinancialSettingModule } from "./financial-setting/financial-setting.module";
import { FinancialCategoryModule } from "./financial-category/financial-category.module";
import { FinancialWalletModule } from "./financial-wallet/financial-wallet.module";
import { FinancialTransactionModule } from "./financial-transaction/financial-transaction.module";

@Module({
  imports: [
    FinancialSettingModule,
    FinancialCategoryModule,
    FinancialWalletModule,
    FinancialTransactionModule,
  ],
  providers: [],
})
export class FinancialModule {}
