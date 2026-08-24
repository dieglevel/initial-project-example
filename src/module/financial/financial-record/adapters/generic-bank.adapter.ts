import { Injectable } from "@nestjs/common";
import {
  IBankNotificationAdapter,
  ParsedBankNotification,
} from "./bank-adapter.interface";
import { FINANCIAL_TRANSACTION_TYPE } from "../../financial-transaction/financial-transaction.enum";
import type { FinancialRecordDTO } from "../dto/record.dto";

@Injectable()
export class GenericBankAdapter implements IBankNotificationAdapter {
  supports(_appPackage: string): boolean {
    return true; // Generic Fallback
  }

  parse(payload: FinancialRecordDTO): ParsedBankNotification | null {
    const rawText =
      payload.notification || payload.title || payload.sub_text || "";
    if (!rawText) return null;

    // Check for explicit sign or keywords
    const incomeMatch = rawText.match(
      /(?:\+|\bco\b|nhan tien|cong tien)\s*([\d,.]+)\s*(?:VND|đ)?/i,
    );
    const expenseMatch = rawText.match(
      /(?:-|\btru\b|thanh toan|chuyen tien)\s*([\d,.]+)\s*(?:VND|đ)?/i,
    );

    let amount = 0;
    let type = FINANCIAL_TRANSACTION_TYPE.EXPENSE;

    if (incomeMatch && incomeMatch[1]) {
      amount = this.cleanAmount(incomeMatch[1]);
      type = FINANCIAL_TRANSACTION_TYPE.INCOME;
    } else if (expenseMatch && expenseMatch[1]) {
      amount = this.cleanAmount(expenseMatch[1]);
      type = FINANCIAL_TRANSACTION_TYPE.EXPENSE;
    } else {
      // General fallback regex for any currency number
      const anyNumberMatch = rawText.match(/([\d,.]+)\s*(?:VND|đ)/i);
      if (anyNumberMatch && anyNumberMatch[1]) {
        amount = this.cleanAmount(anyNumberMatch[1]);
        type = FINANCIAL_TRANSACTION_TYPE.EXPENSE;
      }
    }

    if (amount <= 0) return null;

    const merchantName = payload.title || payload.app_package || "Ngân hàng";

    return {
      amount,
      type,
      description: rawText,
      merchant: merchantName,
    };
  }

  private cleanAmount(valStr: string): number {
    const cleaned = valStr.replace(/[,.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
}
