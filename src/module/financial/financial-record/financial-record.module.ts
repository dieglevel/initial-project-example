import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialRecordService } from "./financial-record.service";
import { FinancialRecordController } from "./financial-record.controller";
import { FinancialRecordEntity } from "./_entities/financial-record.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FinancialWalletModule } from "../financial-wallet/financial-wallet.module";

import { VietinBankAdapter } from "./adapters/implement/vietinbank.adapter";
import { VietcombankAdapter } from "./adapters/implement/vietcombank.adapter";
import { MBBankAdapter } from "./adapters/implement/mbbank.adapter";
import { TPBankAdapter } from "./adapters/implement/tpbank.adapter";
import { GenericBankAdapter } from "./adapters/generic-bank.adapter";
import { BankAdapterService } from "./adapters/bank-adapter.service";
import { FinancialTransactionItemEntity } from "../financial-transaction/_entities/financial-transaction-item.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialRecordEntity,
      FinancialWalletEntity,
      FinancialTransactionEntity,
      FinancialTransactionItemEntity,
    ]),
    FinancialWalletModule,
  ],
  controllers: [FinancialRecordController],
  providers: [
    FinancialRecordService,
    BankAdapterService,
    VietinBankAdapter,
    VietcombankAdapter,
    MBBankAdapter,
    TPBankAdapter,
    GenericBankAdapter,
  ],
  exports: [FinancialRecordService, BankAdapterService],
})
export class FinancialRecordModule {}
