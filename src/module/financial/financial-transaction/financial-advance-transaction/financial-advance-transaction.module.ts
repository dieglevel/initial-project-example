import { Module } from "@nestjs/common";
import { FinancialAdvanceTransactionService } from "./financial-advance-transaction.service";
import { FinancialAdvanceTransactionController } from "./financial-advance-transaction.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialAdvanceTransactionEntity } from "./_entities/financial-advance-transaction.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialAdvanceTransactionEntity])],
  controllers: [FinancialAdvanceTransactionController],
  providers: [FinancialAdvanceTransactionService],
  exports: [FinancialAdvanceTransactionService],
})
export class FinancialAdvanceTransactionModule {}
