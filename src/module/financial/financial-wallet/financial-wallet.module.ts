import { Module } from "@nestjs/common";
import { FinancialWalletService } from "./financial-wallet.service";
import { FinancialWalletController } from "./financial-wallet.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialWalletEntity } from "./_entities/financial-wallet.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialWalletEntity])],
  controllers: [FinancialWalletController],
  providers: [FinancialWalletService],
  exports: [FinancialWalletService],
})
export class FinancialWalletModule {}
