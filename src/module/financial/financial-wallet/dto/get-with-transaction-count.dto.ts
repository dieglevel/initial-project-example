import { OmitType } from "@nestjs/swagger";
import { FinancialWalletEntity } from "../_entities/financial-wallet.entity";

export class FinancialWallet_GetWithTransactionCount_Response extends OmitType(
  FinancialWalletEntity,
  [],
) {
  totalAmount: number;
}
