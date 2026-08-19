import { Module } from "@nestjs/common";
import { FinancialDebtService } from "./financial-debt.service";
import { FinancialDebtController } from "./financial-debt.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialDebtEntity } from "./_entities/financial-debt.entity";
import { FinancialDebtHistoryEntity } from "./_entities/financial-debt-history.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialDebtEntity,
      FinancialDebtHistoryEntity,
      FinancialWalletEntity,
    ]),
  ],
  controllers: [FinancialDebtController],
  providers: [FinancialDebtService],
  exports: [FinancialDebtService],
})
export class FinancialDebtModule {}
