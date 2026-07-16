import { Module } from "@nestjs/common";
import { FinancialWalletTransferService } from "./financial-wallet-transfer.service";
import { FinancialWalletTransferController } from "./financial-wallet-transfer.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialWalletTransferEntity } from "./_entities/financial-wallet-transfer.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialWalletTransferEntity])],
  controllers: [FinancialWalletTransferController],
  providers: [FinancialWalletTransferService],
  exports: [FinancialWalletTransferService],
})
export class FinancialWalletTransferModule {}
