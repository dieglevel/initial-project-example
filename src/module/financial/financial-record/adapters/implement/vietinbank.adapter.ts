import { Injectable } from "@nestjs/common";
import {
  IBankNotificationAdapter,
  ParsedBankNotification,
} from "../bank-adapter.interface";
import { FINANCIAL_TRANSACTION_TYPE } from "../../../financial-transaction/financial-transaction.enum";
import type { FinancialRecordDTO } from "../../dto/record.dto";

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

    // 1. Trích xuất biến động số dư (GD: +... hoặc GD: -...)
    // Tách riêng dấu (+/-) và phần số tiền
    const transactionMatch = rawText.match(
      /(?:GD|BDSD)?\s*:\s*([+-])\s*([\d,.]+)\s*(?:VND|đ)?/i,
    );

    let amount = 0;
    let type = FINANCIAL_TRANSACTION_TYPE.EXPENSE;

    if (transactionMatch) {
      const sign = transactionMatch[1];
      const amountStr = transactionMatch[2];

      type =
        sign === "+"
          ? FINANCIAL_TRANSACTION_TYPE.INCOME
          : FINANCIAL_TRANSACTION_TYPE.EXPENSE;
      amount = this.cleanAmount(amountStr);
    } else {
      // Fallback: Tìm các từ khóa cộng/trừ tiền phổ biến của VietinBank
      const incomeMatch = rawText.match(
        /(?:\+|\bBDSD\s*\+|\bco\b)\s*([\d,.]+)\s*(?:VND|đ)?/i,
      );
      const expenseMatch = rawText.match(
        /(?:-|\bBDSD\s*-|\btru\b)\s*([\d,.]+)\s*(?:VND|đ)?/i,
      );

      if (incomeMatch) {
        type = FINANCIAL_TRANSACTION_TYPE.INCOME;
        amount = this.cleanAmount(incomeMatch[1]);
      } else if (expenseMatch) {
        type = FINANCIAL_TRANSACTION_TYPE.EXPENSE;
        amount = this.cleanAmount(expenseMatch[1]);
      }
    }

    if (amount <= 0) return null;

    // 2. Trích xuất Nội dung chuyển khoản (ND:)
    let description = rawText;
    const ndMatch = rawText.match(/(?:ND|Noidung|Noi dung)\s*:\s*(.+)/i);

    if (ndMatch && ndMatch[1]) {
      // Loại bỏ thông tin SDC (Số dư cuối) nếu ND nằm trước SDC
      description = ndMatch[1].replace(/\n?\s*SDC\s*:.*/i, "").trim();
    }

    return {
      amount,
      type,
      description,
      merchant: "VietinBank iPay",
    };
  }

  /**
   * Chuyển đổi chuỗi số tiền dạng "38,000" hoặc "1,000.50" thành number
   */
  private cleanAmount(valStr: string): number {
    if (!valStr) return 0;

    // Nếu chứa cả dấu phẩy và dấu chấm (VD: 1,000.50 hoặc 1.000,50)
    if (valStr.includes(",") && valStr.includes(".")) {
      if (valStr.indexOf(",") < valStr.indexOf(".")) {
        // Dạng chuẩn US: 1,000.50 -> xóa phẩy
        valStr = valStr.replace(/,/g, "");
      } else {
        // Dạng VN/EU: 1.000,50 -> xóa chấm, đổi phẩy thành chấm
        valStr = valStr.replace(/\./g, "").replace(",", ".");
      }
    } else if (valStr.includes(",")) {
      // Chỉ có dấu phẩy: kiểm tra xem là phân cách hàng nghìn hay thập phân
      const parts = valStr.split(",");
      if (parts[parts.length - 1].length === 3) {
        // Là phân cách hàng nghìn (VD: 38,000)
        valStr = valStr.replace(/,/g, "");
      } else {
        // Là số thập phân (VD: 10,5)
        valStr = valStr.replace(",", ".");
      }
    } else if (valStr.includes(".")) {
      // Chỉ có dấu chấm: kiểm tra tương tự
      const parts = valStr.split(".");
      if (parts[parts.length - 1].length === 3) {
        valStr = valStr.replace(/\./g, "");
      }
    }

    const parsed = parseFloat(valStr);
    return isNaN(parsed) ? 0 : parsed;
  }
}
