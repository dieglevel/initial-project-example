import { Injectable, Logger } from "@nestjs/common";
import {
  IBankNotificationAdapter,
  ParsedBankNotification,
} from "./bank-adapter.interface";
import { VietinBankAdapter } from "./vietinbank.adapter";
import { VietcombankAdapter } from "./vietcombank.adapter";
import { MBBankAdapter } from "./mbbank.adapter";
import { TPBankAdapter } from "./tpbank.adapter";
import { GenericBankAdapter } from "./generic-bank.adapter";
import type { FinancialRecordDTO } from "../dto/record.dto";

@Injectable()
export class BankAdapterService {
  private readonly logger = new Logger(BankAdapterService.name);
  private readonly adapters: IBankNotificationAdapter[];

  constructor(
    private readonly vietinBankAdapter: VietinBankAdapter,
    private readonly vietcombankAdapter: VietcombankAdapter,
    private readonly mbBankAdapter: MBBankAdapter,
    private readonly tpBankAdapter: TPBankAdapter,
    private readonly genericBankAdapter: GenericBankAdapter,
  ) {
    this.adapters = [
      this.vietinBankAdapter,
      this.vietcombankAdapter,
      this.mbBankAdapter,
      this.tpBankAdapter,
      this.genericBankAdapter,
    ];
  }

  parseNotification(
    payload: FinancialRecordDTO,
  ): ParsedBankNotification | null {
    const appPackage = payload.app_package;

    const adapter =
      this.adapters.find((a) => a.supports(appPackage)) ||
      this.genericBankAdapter;

    this.logger.log(
      `Parsing notification using adapter: ${adapter.constructor.name} for package: ${appPackage}`,
    );

    return adapter.parse(payload);
  }
}
