import { FinancialWalletEntity } from "../_entities/financial-wallet.entity";
import { PartialType } from "@nestjs/swagger/dist/type-helpers/partial-type.helper";

export class FinancialWallet_Update_Request extends PartialType(
  FinancialWalletEntity,
) {}

export class FinancialWallet_Update_Response extends FinancialWalletEntity {}
