import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialRecordEntity } from "./_entities/financial-record.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FINANCIAL_TRANSACTION_STATUS } from "../financial-transaction/financial-transaction.enum";
import { BankAdapterService } from "./adapters/bank-adapter.service";
import { FinancialWalletService } from "../financial-wallet/financial-wallet.service";
import type { FinancialRecordDTO } from "./dto/record.dto";

@Injectable()
export class FinancialRecordService {
  private readonly logger = new Logger(FinancialRecordService.name);

  constructor(
    @InjectRepository(FinancialRecordEntity)
    private readonly financialRecordRepository: Repository<FinancialRecordEntity>,

    @InjectRepository(FinancialWalletEntity)
    private readonly financialWalletRepository: Repository<FinancialWalletEntity>,

    @InjectRepository(FinancialTransactionEntity)
    private readonly financialTransactionRepository: Repository<FinancialTransactionEntity>,

    private readonly bankAdapterService: BankAdapterService,
    private readonly financialWalletService: FinancialWalletService,
  ) {}

  async processIncomingRecord(
    payload: FinancialRecordDTO,
    apiKey?: string,
  ): Promise<{
    status: string;
    message: string;
    record?: FinancialRecordEntity;
    transaction?: FinancialTransactionEntity;
  }> {
    if (!apiKey) {
      throw new BadRequestException(
        "Missing API Key in request headers or payload",
      );
    }

    // 1. Check API Key & Find Wallet
    let wallet: FinancialWalletEntity | null = null;
    if (apiKey) {
      wallet = await this.financialWalletService.findByApiKey(apiKey);
    }

    if (!wallet) {
      this.logger.warn(`Incoming record rejected: Invalid API key '${apiKey}'`);
      const invalidRecord = this.financialRecordRepository.create({
        record: payload,
        appPackage: payload.app_package,
        apiKey,
        status: "INVALID_API_KEY",
      });
      const savedRecord =
        await this.financialRecordRepository.save(invalidRecord);
      return {
        status: "INVALID_API_KEY",
        message: "Invalid or missing Wallet API Key",
        record: savedRecord,
      };
    }

    // 2. Parse notification payload using Bank Adapters
    const parsed = this.bankAdapterService.parseNotification(payload);

    if (!parsed || parsed.amount <= 0) {
      this.logger.warn(
        `Incoming record parsed with 0 amount or unsupported format for wallet ${wallet.id}`,
      );
      const parseFailedRecord = this.financialRecordRepository.create({
        record: payload,
        appPackage: payload.app_package,
        apiKey,
        walletId: wallet.id,
        status: "PARSE_FAILED",
      });
      const savedRecord =
        await this.financialRecordRepository.save(parseFailedRecord);
      return {
        status: "PARSE_FAILED",
        message:
          "Notification received but failed to extract transaction amount",
        record: savedRecord,
      };
    }

    // 3. Create Financial Transaction with status = PENDING
    const newTransaction = this.financialTransactionRepository.create({
      wallet: wallet,
      walletId: wallet.id,
      account: wallet.account,
      amount: parsed.amount,
      type: parsed.type,
      status: FINANCIAL_TRANSACTION_STATUS.PENDING,
      description: parsed.description,
      merchant: parsed.merchant || "Bank Notification",
    });

    const savedTransaction =
      await this.financialTransactionRepository.save(newTransaction);

    // 4. Save Financial Record linking to Wallet & Transaction
    const recordEntity = this.financialRecordRepository.create({
      record: payload,
      appPackage: payload.app_package,
      apiKey,
      walletId: wallet.id,
      transactionId: savedTransaction.id,
      parsedAmount: parsed.amount,
      status: "PENDING_TRANSACTION_CREATED",
    });

    const savedRecord = await this.financialRecordRepository.save(recordEntity);

    this.logger.log(
      `Successfully created pending transaction #${savedTransaction.id} for wallet #${wallet.id} from record #${savedRecord.id}`,
    );

    return {
      status: "SUCCESS",
      message: "Notification record received and pending transaction created",
      record: savedRecord,
      transaction: savedTransaction,
    };
  }

  async getAllRecords(): Promise<FinancialRecordEntity[]> {
    return this.financialRecordRepository.find({
      order: { id: "DESC" },
      take: 100,
    });
  }
}
