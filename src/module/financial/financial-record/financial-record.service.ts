import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialRecordEntity } from "./_entities/financial-record.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FINANCIAL_TRANSACTION_STATUS } from "../financial-transaction/financial-transaction.enum";
import { BankAdapterService } from "./adapters/bank-adapter.service";
import { FinancialWalletService } from "../financial-wallet/financial-wallet.service";
import type { FinancialRecordDTO } from "./dto/record.dto";
import { FinancialTransactionItemEntity } from "../financial-transaction/_entities/financial-transaction-item.entity";

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

    @InjectRepository(FinancialTransactionItemEntity)
    private readonly financialTransactionItemRepository: Repository<FinancialTransactionItemEntity>,

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

    // 0. Idempotency check: nếu id_notification đã tồn tại thì bỏ qua
    const idNotification = payload.id_notification;
    if (idNotification) {
      const existing = await this.financialRecordRepository.findOne({
        where: { idNotification },
      });
      if (existing) {
        this.logger.log(
          `Duplicate notification detected (id_notification: '${idNotification}'). Skipping.`,
        );
        return {
          status: "DUPLICATE",
          message: "Notification with this id_notification already processed",
          record: existing,
        };
      }
    }

    // 1. Check app_package có được hỗ trợ không
    if (!this.bankAdapterService.supportsPackage(payload.app_package)) {
      this.logger.warn(
        `Unsupported app_package: '${payload.app_package}'. No matching adapter found.`,
      );
      const unsupportedRecord = this.financialRecordRepository.create({
        idNotification: idNotification || null,
        record: payload,
        appPackage: payload.app_package,
        apiKey,
        status: "UNSUPPORTED_PACKAGE",
      });
      const savedRecord =
        await this.financialRecordRepository.save(unsupportedRecord);
      return {
        status: "UNSUPPORTED_PACKAGE",
        message: `app_package '${payload.app_package}' is not supported by any bank adapter`,
        record: savedRecord,
      };
    }

    // 2. Check API Key & Find Wallet
    let wallet: FinancialWalletEntity | null = null;
    if (apiKey) {
      wallet = await this.financialWalletService.findByApiKey(apiKey);
    }

    if (!wallet) {
      this.logger.warn(`Incoming record rejected: Invalid API key '${apiKey}'`);
      const invalidRecord = this.financialRecordRepository.create({
        idNotification: idNotification || null,
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

    // 3. Parse notification payload using Bank Adapters
    const parsed = this.bankAdapterService.parseNotification(payload);

    if (!parsed || parsed.amount <= 0) {
      this.logger.warn(
        `Incoming record parsed with 0 amount or unsupported format for wallet ${wallet.id}`,
      );
      const parseFailedRecord = this.financialRecordRepository.create({
        idNotification: idNotification || null,
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

    // 4. Create & Save Financial Transaction with status = PENDING
    const newTransaction = this.financialTransactionRepository.create({
      wallet: wallet,
      walletId: wallet.id,
      account: wallet.account,
      amount: parsed.amount,
      type: parsed.type,
      status: FINANCIAL_TRANSACTION_STATUS.PENDING,
      description: parsed.description || "Bank Notification",
      merchant: parsed.merchant || "Bank Notification",
    });

    const savedTransaction =
      await this.financialTransactionRepository.save(newTransaction);

    // 5. Create & Save Financial Transaction Item
    const transactionItem = this.financialTransactionItemRepository.create({
      description: parsed.merchant,
      amount: parsed.amount,
      transaction: savedTransaction,
      transactionId: savedTransaction.id,
    });

    await this.financialTransactionItemRepository.save(transactionItem);

    // 6. Save Financial Record linking to Wallet & Transaction
    // Dùng try/catch để xử lý race condition: 2 request cùng id_notification đến đồng thời
    try {
      const recordEntity = this.financialRecordRepository.create({
        idNotification: idNotification || null,
        record: payload,
        appPackage: payload.app_package,
        apiKey,
        walletId: wallet.id,
        transactionId: savedTransaction.id,
        parsedAmount: parsed.amount,
        status: "PENDING_TRANSACTION_CREATED",
      });

      const savedRecord =
        await this.financialRecordRepository.save(recordEntity);

      this.logger.log(
        `Successfully created pending transaction #${savedTransaction.id} with item for wallet #${wallet.id} from record #${savedRecord.id}`,
      );

      return {
        status: "SUCCESS",
        message: "Notification record received and pending transaction created",
        record: savedRecord,
        transaction: savedTransaction,
      };
    } catch (err: unknown) {
      // Unique constraint violation: record đã được xử lý bởi request song song
      const dbError = err as { code?: string; message?: string };
      if (dbError.code === "23505" || dbError.message?.includes("duplicate")) {
        this.logger.warn(
          `Race condition detected for id_notification '${idNotification}': rolling back transaction #${savedTransaction.id}`,
        );
        // Rollback transaction và item vừa tạo
        await this.financialTransactionItemRepository.delete({
          transactionId: savedTransaction.id,
        });
        await this.financialTransactionRepository.delete(savedTransaction.id);

        const duplicate = await this.financialRecordRepository.findOne({
          where: { idNotification },
        });
        return {
          status: "DUPLICATE",
          message:
            "Notification with this id_notification already processed (race condition)",
          record: duplicate ?? undefined,
        };
      }
      throw err;
    }
  }

  async getAllRecords(): Promise<FinancialRecordEntity[]> {
    return this.financialRecordRepository.find({
      order: { id: "DESC" },
      take: 100,
    });
  }
}
