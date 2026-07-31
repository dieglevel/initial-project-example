import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialNotificationEntity } from "./_entities/financial-notification.entity";
import { FinancialNotificationController } from "./financial-notification.controller";
import { FinancialNotificationService } from "./financial-notification.service";
import { FinancialNotificationCron } from "./financial-notification.cron";
import { FinancialCategoryEntity } from "../financial-category/_entities/financial-category.entity";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialNotificationEntity,
      FinancialCategoryEntity,
      FinancialTransactionEntity,
      FinancialWalletEntity,
    ]),
  ],
  controllers: [FinancialNotificationController],
  providers: [FinancialNotificationService, FinancialNotificationCron],
  exports: [FinancialNotificationService],
})
export class FinancialNotificationModule {}
