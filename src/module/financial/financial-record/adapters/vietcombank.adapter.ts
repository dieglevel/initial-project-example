import { Injectable } from "@nestjs/common";
import {
  IBankNotificationAdapter,
  ParsedBankNotification,
} from "./bank-adapter.interface";
import { FINANCIAL_TRANSACTION_TYPE } from "../../financial-transaction/financial-transaction.enum";
import type { FinancialRecordDTO } from "../dto/record.dto";

@Injectable()
export class VietcombankAdapter implements IBankNotificationAdapter {
  private readonly appPackages = [
    "com.vcb.bank",
    "vn.vcb.bank",
    "com.vietcombank",
    "vietcombank",
  ];

  supports(appPackage: string): boolean {
    if (!appPackage) return false;
    const pkg = appPackage.toLowerCase();
    return this.appPackages.some((p) => pkg.includes(p));
  }

  parse(payload: FinancialRecordDTO): ParsedBankNotification | null {
    const rawText =
      payload.notification || payload.title || payload.sub_text || "";
    if (!rawText) return null;

    // Vietcombank text format: "SD TK 0011... +1,000,000 VND luc 24-08-2026..." or "SD TK 0011... -500,000 VND..."
    const incomeMatch = rawText.match(
      /(?:\+|giao dich cộng|\bco\b)\s*([\d,.]+)\s*(?:VND|đ)?/i,
    );
    const expenseMatch = rawText.match(
      /(?:-|giao dich trừ|\btru\b)\s*([\d,.]+)\s*(?:VND|đ)?/i,
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
    const ndMatch = rawText.match(/(?:ND|Ref|Noidung):\s*(.+)/i);
    if (ndMatch && ndMatch[1]) {
      description = ndMatch[1].trim();
    }

    return {
      amount,
      type,
      description,
      merchant: "Vietcombank VCB Digibank",
    };
  }

  private cleanAmount(valStr: string): number {
    const cleaned = valStr.replace(/[,.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
}
