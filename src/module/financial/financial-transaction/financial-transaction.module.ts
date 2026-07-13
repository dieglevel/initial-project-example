import { Module } from "@nestjs/common";
import { FinancialTransactionService } from "./financial-transaction.service";
import { FinancialTransactionController } from "./financial-transaction.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialTransactionEntity])],
  controllers: [FinancialTransactionController],
  providers: [FinancialTransactionService],
  exports: [FinancialTransactionService],
})
export class FinancialTransactionModule {}
