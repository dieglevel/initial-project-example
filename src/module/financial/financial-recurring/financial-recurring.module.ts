import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialRecurringEntity } from "./_entities/financial-recurring.entity";
import { FinancialRecurringController } from "./financial-recurring.controller";
import { FinancialRecurringService } from "./financial-recurring.service";
import { FinancialRecurringCron } from "./financial-recurring.cron";
import { FinancialTransactionModule } from "../financial-transaction/financial-transaction.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialRecurringEntity]),
    FinancialTransactionModule,
  ],
  controllers: [FinancialRecurringController],
  providers: [FinancialRecurringService, FinancialRecurringCron],
  exports: [FinancialRecurringService],
})
export class FinancialRecurringModule {}
