import { OmitType } from "@nestjs/swagger";
import { FinancialWalletTransferEntity } from "../_entities/financial-wallet-transfer.entity";
export class FinancialWalletTransfer_Get_Request {
  date: Date;
}

export class FinancialWalletTransfer_Get_Response extends FinancialWalletTransferEntity {}
