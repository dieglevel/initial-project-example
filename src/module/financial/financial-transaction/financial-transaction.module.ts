import { Module } from "@nestjs/common";
import { FinancialTransactionService } from "./financial-transaction.service";
import { FinancialTransactionController } from "./financial-transaction.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialTransactionEntity,
      FinancialWalletEntity,
    ]),
  ],
  controllers: [FinancialTransactionController],
  providers: [FinancialTransactionService],
  exports: [FinancialTransactionService],
})
export class FinancialTransactionModule {}
