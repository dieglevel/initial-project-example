import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
import { FinancialWalletEntity } from "../_entities/financial-wallet.entity";
import { PartialType } from "@nestjs/swagger";

export class FinancialWallet_Create_Request extends PartialType(
  FinancialWalletEntity,
) {}

export class FinancialWallet_Create_Response extends FinancialWalletEntity {}
