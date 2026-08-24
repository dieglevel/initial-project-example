import { Injectable } from "@nestjs/common";
import {
  IBankNotificationAdapter,
  ParsedBankNotification,
} from "./bank-adapter.interface";
import { FINANCIAL_TRANSACTION_TYPE } from "../../financial-transaction/financial-transaction.enum";
import type { FinancialRecordDTO } from "../dto/record.dto";

@Injectable()
export class MBBankAdapter implements IBankNotificationAdapter {
  private readonly appPackages = ["com.mbmobile", "com.mb", "mbbank"];

  supports(appPackage: string): boolean {
    if (!appPackage) return false;
    const pkg = appPackage.toLowerCase();
    return this.appPackages.some((p) => pkg.includes(p));
  }

  parse(payload: FinancialRecordDTO): ParsedBankNotification | null {
    const rawText =
      payload.notification || payload.title || payload.sub_text || "";
    if (!rawText) return null;

    // MBBank: "TK 098... +100,000VND luc..." or "TK 098... -50,000VND..."
    const incomeMatch = rawText.match(
      /(?:\+|\bco\b)\s*([\d,.]+)\s*(?:VND|đ)?/i,
    );
    const expenseMatch = rawText.match(
      /(?:-|\btru\b)\s*([\d,.]+)\s*(?:VND|đ)?/i,
    );

    let amount = 0;
    let type = FINANCIAL_TRANSACTION_TYPE.EXPENSE;

    if (incomeMatch && incomeMatch[1]) {
      amount = this.cleanAmount(incomeMatch[1]);
      type = FINANCIAL_TRANSACTION_TYPE.INCOME;
    } else if (expenseMatch && expenseMatch[1]) {
      amount = this.cleanAmount(expenseMatch[1]);
      type = FINANCIAL_TRANSACTION_TYPE.EXPENSE;
    }

    if (amount <= 0) return null;

    let description = rawText;
    const ndMatch = rawText.match(/(?:ND|Noidung):\s*(.+)/i);
    if (ndMatch && ndMatch[1]) {
      description = ndMatch[1].trim();
    }

    return {
      amount,
      type,
      description,
      merchant: "MB Bank",
    };
  }

  private cleanAmount(valStr: string): number {
    const cleaned = valStr.replace(/[,.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
}
