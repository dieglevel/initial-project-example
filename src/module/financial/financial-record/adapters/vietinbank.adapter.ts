import { Injectable } from "@nestjs/common";
import {
  IBankNotificationAdapter,
  ParsedBankNotification,
} from "./bank-adapter.interface";
import { FINANCIAL_TRANSACTION_TYPE } from "../../financial-transaction/financial-transaction.enum";
import type { FinancialRecordDTO } from "../dto/record.dto";

@Injectable()
export class VietinBankAdapter implements IBankNotificationAdapter {
  private readonly appPackages = [
    "com.vietinbank.ipay",
    "com.vietinbank",
    "vietinbank",
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

    // Ví dụ text: "TK 10123456789 +500,000VND vao 24/08/2026. ND: Chuyen khoan..."
    // Hoặc: "TK 10123456789 -250.000 VND. ND: Thanh toan..."
    const incomeMatch = rawText.match(
      /(?:\+|BDSD\s*\+|\bco\b)\s*([\d,.]+)\s*(?:VND|đ)?/i,
    );
    const expenseMatch = rawText.match(
      /(?:-|BDSD\s*-|\btru\b)\s*([\d,.]+)\s*(?:VND|đ)?/i,
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
      // Fallback: Tìm con số bất kỳ nếu có chữ + hoặc -
      const generalMatch = rawText.match(/([+-])\s*([\d,.]+)/);
      if (generalMatch) {
        type =
          generalMatch[1] === "+"
            ? FINANCIAL_TRANSACTION_TYPE.INCOME
            : FINANCIAL_TRANSACTION_TYPE.EXPENSE;
        amount = this.cleanAmount(generalMatch[2]);
      }
    }

    if (amount <= 0) return null;

    // Lấy nội dung ghi chú sau ND:
    let description = rawText;
    const ndMatch = rawText.match(/(?:ND|Noidung|Noi dung):\s*(.+)/i);
    if (ndMatch && ndMatch[1]) {
      description = ndMatch[1].trim();
    }

    return {
      amount,
      type,
      description,
      merchant: "VietinBank iPay",
    };
  }

  private cleanAmount(valStr: string): number {
    const cleaned = valStr.replace(/[,.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
}
