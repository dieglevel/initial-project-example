import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";
import type { FinancialTransaction_Create_Request } from "./dto/create.dto";
import type { FinancialTransaction_GetWithDate_Request } from "./dto/get-with-date.dto";
import type { FinancialTransaction_GetAll_Response } from "./dto/get-all.dto";
import dayjs from "dayjs";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import {
  FINANCIAL_TRANSACTION_TYPE,
  FINANCIAL_TRANSACTION_STATUS,
} from "./financial-transaction.enum";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialTransactionItemEntity } from "./_entities/financial-transaction-item.entity";

@Injectable()
export class FinancialTransactionService extends BaseCrudService<FinancialTransactionEntity> {
  constructor(
    @InjectRepository(FinancialTransactionEntity)
    private readonly financialTransactionRepository: Repository<FinancialTransactionEntity>,

    @InjectRepository(FinancialWalletEntity)
    private readonly financialWalletRepository: Repository<FinancialWalletEntity>,

    private readonly dataSource: DataSource,
  ) {
    super(financialTransactionRepository);
  }
  async createOverride(
    dto: FinancialTransaction_Create_Request,
    user: JwtPayload,
  ): Promise<FinancialTransactionEntity> {
    const {
      walletId,
      toWalletId,
      financialTransactionItems,
      ...transactionData
    } = dto;

    return await this.dataSource.transaction(async (manager) => {
      // 1. Lock ví nguồn
      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: walletId },
        lock: { mode: "pessimistic_write" },
      });

      if (!wallet) {
        throw new NotFoundException("Wallet not found");
      }

      const amount = Number(transactionData.amount);
      const currentBalance = Number(wallet.balance);

      // 2. Xử lý số dư theo cả 5 ENUM
      switch (transactionData.type) {
        case FINANCIAL_TRANSACTION_TYPE.EXPENSE:
          if (currentBalance < amount) {
            throw new BadRequestException("Insufficient wallet balance");
          }
          wallet.balance = currentBalance - amount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.INCOME:
        case FINANCIAL_TRANSACTION_TYPE.REFUND:
          wallet.balance = currentBalance + amount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT:
          // Cộng/Trừ trực tiếp theo giá trị amount
          wallet.balance = currentBalance + amount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.TRANSFER: {
          if (!toWalletId) {
            throw new BadRequestException(
              "Destination wallet (toWalletId) is required for transfers",
            );
          }
          if (walletId === toWalletId) {
            throw new BadRequestException("Cannot transfer to the same wallet");
          }
          if (currentBalance < amount) {
            throw new BadRequestException(
              "Insufficient wallet balance for transfer",
            );
          }

          // Lock và cộng tiền cho ví đích
          const targetWallet = await manager.findOne(FinancialWalletEntity, {
            where: { id: toWalletId },
            lock: { mode: "pessimistic_write" },
          });

          if (!targetWallet) {
            throw new NotFoundException("Destination wallet not found");
          }

          wallet.balance = currentBalance - amount;
          targetWallet.balance = Number(targetWallet.balance) + amount;
          await manager.save(targetWallet);
          break;
        }

        default:
          throw new BadRequestException("Invalid transaction type");
      }

      // 3. Tạo Transaction record
      const transaction = manager.create(FinancialTransactionEntity, {
        ...transactionData,
        wallet,
        status:
          transactionData.status || FINANCIAL_TRANSACTION_STATUS.COMPLETED,
        createdAt: transactionData.date
          ? new Date(transactionData.date)
          : new Date(),
        account: { id: user.sub },
      });

      const savedTransaction = await manager.save(transaction);

      // 4. Lưu Transaction Items (nếu có)
      if (financialTransactionItems && financialTransactionItems.length > 0) {
        const transactionItems = financialTransactionItems.map((item) =>
          manager.create(FinancialTransactionItemEntity, {
            ...item,
            amount: Number(item.amount),
            transactionId: savedTransaction.id,
          }),
        );
        await manager.save(transactionItems);
        savedTransaction.financialTransactionItems = transactionItems;
      }

      // 5. Cập nhật số dư ví nguồn
      await manager.save(wallet);

      return savedTransaction;
    });
  }

  async getByDate({
    date,
    user,
  }: {
    date: FinancialTransaction_GetWithDate_Request["date"];
    user: JwtPayload;
  }): Promise<{
    transactions: FinancialTransactionEntity[];
    totalExpense: number;
    totalIncome: number;
  }> {
    const targetDate = dayjs(date);
    const startDate = targetDate.startOf("month").toDate();
    const endDate = targetDate.endOf("month").toDate();

    // 1. Lấy danh sách giao dịch cùng các quan hệ
    const transactions = await this.financialTransactionRepository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.wallet", "wallet")
      .leftJoinAndSelect(
        "transaction.financialTransactionItems",
        "financialTransactionItems",
      )
      .leftJoinAndSelect("financialTransactionItems.category", "category")
      .where("transaction.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .andWhere("transaction.accountId = :accountId", {
        accountId: user.sub,
      })
      .orderBy("transaction.createdAt", "DESC")
      .getMany();

    // 2. Tính tổng expense và income từ danh sách đã lấy
    const totals = transactions.reduce(
      (acc, transaction) => {
        // Giả sử entity của bạn có thuộc tính type ('EXPENSE' | 'INCOME') và amount (hoặc totalAmount)
        if (transaction.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE) {
          acc.totalExpense += Number(transaction.amount || 0);
        } else if (transaction.type === FINANCIAL_TRANSACTION_TYPE.INCOME) {
          acc.totalIncome += Number(transaction.amount || 0);
        }
        return acc;
      },
      { totalExpense: 0, totalIncome: 0 },
    );

    return {
      transactions,
      totalExpense: totals.totalExpense,
      totalIncome: totals.totalIncome,
    };
  }

  async createAutomatedTransaction({
    accountId,
    walletId,
    categoryId, // <-- Bổ sung tham số này
    amount,
    type,
    description,
    merchant,
    location,
    tags,
    receiptImageUrl,
    originalTransactionId,
    date,
    status,
  }: {
    accountId: number;
    walletId: number;
    categoryId?: number; // <-- Bổ sung tham số này
    amount: number;
    type: FINANCIAL_TRANSACTION_TYPE;
    description?: string;
    merchant?: string;
    location?: string;
    tags?: string[];
    receiptImageUrl?: string;
    originalTransactionId?: number;
    date?: Date;
    status?: FINANCIAL_TRANSACTION_STATUS;
  }): Promise<FinancialTransactionEntity> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: walletId },
        lock: { mode: "pessimistic_write" },
      });

      if (!wallet) {
        throw new NotFoundException("Wallet not found");
      }

      const numericAmount = Number(amount);
      const currentBalance = Number(wallet.balance);

      switch (type) {
        case FINANCIAL_TRANSACTION_TYPE.EXPENSE:
          wallet.balance = currentBalance - numericAmount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.INCOME:
        case FINANCIAL_TRANSACTION_TYPE.REFUND:
        case FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT:
          wallet.balance = currentBalance + numericAmount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.TRANSFER:
          throw new BadRequestException(
            "Use financial-wallet transfer endpoint for internal transfers",
          );

        default:
          throw new BadRequestException("Invalid transaction type");
      }

      // 1. Tạo Transaction chính (Master)
      const transaction = manager.create(FinancialTransactionEntity, {
        amount: numericAmount,
        description,
        merchant,
        location,
        tags,
        receiptImageUrl,
        type,
        status: status ?? FINANCIAL_TRANSACTION_STATUS.COMPLETED,
        wallet,
        ...(originalTransactionId
          ? {
              originalTransaction: {
                id: originalTransactionId,
              },
            }
          : {}),
        createdAt: date ?? new Date(),
        account: {
          id: accountId,
        },
      });

      await manager.save(wallet);
      const savedTransaction = await manager.save(transaction);

      // 2. Nếu có categoryId, tự động tạo Advance Transaction con (Detail)
      if (categoryId) {
        const advanceItem = manager.create(FinancialTransactionItemEntity, {
          amount: numericAmount,
          description: description ?? "Automated Item",
          category: { id: categoryId },
          transactionId: savedTransaction.id,
        });

        await manager.save(advanceItem);
      }

      return savedTransaction;
    });
  }

  async view(
    id: number,
    user: JwtPayload,
  ): Promise<FinancialTransactionEntity> {
    const transaction = await this.financialTransactionRepository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.wallet", "wallet")
      .leftJoinAndSelect(
        "transaction.financialTransactionItems",
        "financialTransactionItems",
      )
      .leftJoinAndSelect("financialTransactionItems.category", "category") // Join category từ transactionItem
      .where("transaction.id = :id", { id })
      .andWhere("transaction.accountId = :accountId", {
        accountId: user.sub,
      })
      .getOne();

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    return transaction;
  }
}
