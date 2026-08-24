import { FINANCIAL_TRANSACTION_TYPE } from "../../financial-transaction/financial-transaction.enum";
import type { FinancialRecordDTO } from "../dto/record.dto";

export interface ParsedBankNotification {
  amount: number;
  type: FINANCIAL_TRANSACTION_TYPE;
  description: string;
  merchant?: string;
  accountNumber?: string;
}

export interface IBankNotificationAdapter {
  supports(appPackage: string): boolean;
  parse(payload: FinancialRecordDTO): ParsedBankNotification | null;
}
