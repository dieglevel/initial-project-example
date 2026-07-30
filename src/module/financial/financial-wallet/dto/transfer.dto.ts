import { IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class FinancialWallet_Transfer_Request {
  @IsNumber()
  @IsNotEmpty()
  fromWalletId: number;

  @IsNumber()
  @IsNotEmpty()
  toWalletId: number;

  @IsNumber()
  amount: number;

  @IsNumber()
  transferFee: number;
}

export class FinancialWallet_Transfer_Response {
  message: string;
}
