import { PartialType } from "@nestjs/swagger";
import { FinancialDebtEntity } from "../_entities/financial-debt.entity";
import { IsNotEmpty, IsNumber } from "class-validator";

export class FinancialDebt_Create_Request extends PartialType(
  FinancialDebtEntity,
) {
  @IsNotEmpty()
  @IsNumber()
  walletId: number;
}

export class FinancialDebt_Create_Response extends FinancialDebtEntity {}
