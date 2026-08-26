import { Injectable, Logger } from "@nestjs/common";
import {
  IBankNotificationAdapter,
  ParsedBankNotification,
} from "./bank-adapter.interface";
import { VietinBankAdapter } from "./implement/vietinbank.adapter";
import { VietcombankAdapter } from "./implement/vietcombank.adapter";
import { MBBankAdapter } from "./implement/mbbank.adapter";
import { TPBankAdapter } from "./implement/tpbank.adapter";
import { GenericBankAdapter } from "./generic-bank.adapter";
import type { FinancialRecordDTO } from "../dto/record.dto";

@Injectable()
export class BankAdapterService {
  private readonly logger = new Logger(BankAdapterService.name);

  /** Các adapter cụ thể (không bao gồm GenericBankAdapter) */
  private readonly specificAdapters: IBankNotificationAdapter[];

  constructor(
    private readonly vietinBankAdapter: VietinBankAdapter,
    private readonly vietcombankAdapter: VietcombankAdapter,
    private readonly mbBankAdapter: MBBankAdapter,
    private readonly tpBankAdapter: TPBankAdapter,
    private readonly genericBankAdapter: GenericBankAdapter,
  ) {
    this.specificAdapters = [
      this.vietinBankAdapter,
      this.vietcombankAdapter,
      this.mbBankAdapter,
      this.tpBankAdapter,
    ];
  }

  /**
   * Kiểm tra xem app_package có được hỗ trợ bởi một adapter cụ thể không.
   * GenericBankAdapter KHÔNG được tính là "support" ở đây.
   */
  supportsPackage(appPackage: string): boolean {
    return this.specificAdapters.some((a) => a.supports(appPackage));
  }

  parseNotification(
    payload: FinancialRecordDTO,
  ): ParsedBankNotification | null {
    const appPackage = payload.app_package;

    const adapter =
      this.specificAdapters.find((a) => a.supports(appPackage)) ||
      this.genericBankAdapter;

    this.logger.log(
      `Parsing notification using adapter: ${adapter.constructor.name} for package: ${appPackage}`,
    );

    return adapter.parse(payload);
  }
}
