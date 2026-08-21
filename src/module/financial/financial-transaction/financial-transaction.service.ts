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
import type { FinancialTransaction_Update_Request } from "./dto/update.dto";
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
      const transferFee = Number(dto.transferFee || 0);
      if (transferFee < 0) {
        throw new BadRequestException("Transfer fee cannot be negative");
      }
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
          const totalDeduction = amount + transferFee;
          if (currentBalance < totalDeduction) {
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

          wallet.balance = currentBalance - totalDeduction;
          targetWallet.balance = Number(targetWallet.balance) + amount;
          await manager.save(targetWallet);

          if (transferFee > 0) {
            const feeItem = manager.create(FinancialTransactionEntity, {
              description: "Transfer Fee",
              amount: transferFee,
              type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
              status: FINANCIAL_TRANSACTION_STATUS.COMPLETED,
              wallet: wallet,
              account: { id: user.sub },
              createdAt: new Date(),
            });
            await manager.save(feeItem);
          }
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
            categoryId: item.categoryId ?? undefined,
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

  async updateOverride(
    id: number,
    dto: FinancialTransaction_Update_Request,
    user: JwtPayload,
  ): Promise<FinancialTransactionEntity> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Lấy giao dịch cũ và kiểm tra quyền sở hữu
      const oldTransaction = await manager.findOne(FinancialTransactionEntity, {
        where: { id, account: { id: user.sub } },
        relations: ["wallet", "financialTransactionItems"],
      });

      if (!oldTransaction) {
        throw new NotFoundException("Transaction not found");
      }

      // 2. Nếu có gửi items, tự động tính lại tổng amount của Transaction từ items
      let calculatedAmount =
        dto.amount !== undefined
          ? Number(dto.amount)
          : Number(oldTransaction.amount);

      const isItemBasedType = [
        FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        FINANCIAL_TRANSACTION_TYPE.INCOME,
        FINANCIAL_TRANSACTION_TYPE.REFUND,
      ].includes(dto.type ?? oldTransaction.type);

      if (
        isItemBasedType &&
        dto.financialTransactionItems &&
        dto.financialTransactionItems.length > 0
      ) {
        calculatedAmount = dto.financialTransactionItems.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0,
        );
      }

      const rawToWalletId = (dto as { toWalletId?: unknown }).toWalletId;
      const normalizedToWalletId =
        typeof rawToWalletId === "number" ? rawToWalletId : undefined;

      // Merge dữ liệu cũ và mới để tính toán chính xác
      const updatedData: {
        walletId: number;
        toWalletId?: number;
        amount: number;
        type: FINANCIAL_TRANSACTION_TYPE;
        transferFee: number;
      } = {
        walletId: dto.walletId ?? oldTransaction.wallet.id,
        toWalletId: normalizedToWalletId,
        amount: calculatedAmount, // Amount tổng chính xác
        type: dto.type ?? oldTransaction.type,
        transferFee:
          dto.transferFee !== undefined ? Number(dto.transferFee) : 0,
      };

      // 3. Lock tất cả các ví có liên quan (ví nguồn cũ, ví nguồn mới, ví đích mới)
      const walletIdsToLock = Array.from(
        new Set(
          [
            oldTransaction.wallet.id,
            updatedData.walletId,
            updatedData.toWalletId,
          ].filter((id): id is number => Boolean(id)),
        ),
      );

      const wallets = await manager.find(FinancialWalletEntity, {
        where: walletIdsToLock.map((wId) => ({ id: wId })),
        lock: { mode: "pessimistic_write" },
      });

      const walletMap = new Map(wallets.map((w) => [w.id, w]));

      // ----------------------------------------------------
      // STEP A: ROLLBACK GIAO DỊCH CŨ (Đảo ngược ảnh hưởng)
      // ----------------------------------------------------
      const oldWallet = walletMap.get(oldTransaction.wallet.id);
      if (!oldWallet)
        throw new NotFoundException("Old source wallet not found");

      const oldAmount = Number(oldTransaction.amount);
      let oldBalance = Number(oldWallet.balance);

      switch (oldTransaction.type) {
        case FINANCIAL_TRANSACTION_TYPE.EXPENSE:
          oldBalance += oldAmount; // Hoàn lại tiền tiêu
          break;

        case FINANCIAL_TRANSACTION_TYPE.INCOME:
        case FINANCIAL_TRANSACTION_TYPE.REFUND:
        case FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT:
          oldBalance -= oldAmount; // Trừ lại tiền thu/điều chỉnh
          break;

        case FINANCIAL_TRANSACTION_TYPE.TRANSFER: {
          // Hoàn lại tiền + phí cho ví nguồn cũ
          oldBalance += oldAmount;
          break;
        }
      }
      oldWallet.balance = oldBalance;

      // ----------------------------------------------------
      // STEP B: APPLY GIAO DỊCH MỚI (Áp dụng logic mới)
      // ----------------------------------------------------
      const newWallet = walletMap.get(updatedData.walletId);
      if (!newWallet)
        throw new NotFoundException("New source wallet not found");

      const newAmount = updatedData.amount;
      let newBalance = Number(newWallet.balance);

      switch (updatedData.type) {
        case FINANCIAL_TRANSACTION_TYPE.EXPENSE:
          if (newBalance < newAmount) {
            throw new BadRequestException(
              "Insufficient wallet balance for update",
            );
          }
          newBalance -= newAmount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.INCOME:
        case FINANCIAL_TRANSACTION_TYPE.REFUND:
          newBalance += newAmount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT:
          newBalance += newAmount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.TRANSFER: {
          if (!updatedData.toWalletId) {
            throw new BadRequestException(
              "Destination wallet (toWalletId) is required",
            );
          }
          if (updatedData.walletId === updatedData.toWalletId) {
            throw new BadRequestException("Cannot transfer to the same wallet");
          }

          const targetWallet = walletMap.get(updatedData.toWalletId);
          if (!targetWallet)
            throw new NotFoundException("Destination wallet not found");

          const totalDeduction = newAmount + updatedData.transferFee;
          if (newBalance < totalDeduction) {
            throw new BadRequestException(
              "Insufficient wallet balance for transfer",
            );
          }

          newBalance -= totalDeduction;
          targetWallet.balance = Number(targetWallet.balance) + newAmount;
          await manager.save(targetWallet);
          break;
        }

        default:
          throw new BadRequestException("Invalid transaction type");
      }

      newWallet.balance = newBalance;

      // Save tất cả ví đã cập nhật số dư
      await manager.save(Array.from(walletMap.values()));

      // ----------------------------------------------------
      // STEP C: CẬP NHẬT TRANSACTION & ITEMS
      // ----------------------------------------------------
      const {
        financialTransactionItems,
        walletId,
        toWalletId,
        ...transactionData
      } = dto;

      Object.assign(oldTransaction, {
        ...transactionData,
        amount: newAmount, // Cập nhật amount chính xác
        wallet: newWallet,
        createdAt:
          dto.date !== undefined
            ? new Date(String(dto.date))
            : oldTransaction.createdAt,
      });

      const updatedTransaction = await manager.save(oldTransaction);

      // Cập nhật lại Items nếu có
      if (financialTransactionItems) {
        await manager.delete(FinancialTransactionItemEntity, {
          transactionId: id,
        });

        if (financialTransactionItems.length > 0) {
          const newItems = financialTransactionItems.map((item) =>
            manager.create(FinancialTransactionItemEntity, {
              ...item,
              amount: Number(item.amount),
              categoryId: item.categoryId ?? undefined,
              transactionId: id,
            }),
          );
          await manager.save(newItems);
          updatedTransaction.financialTransactionItems = newItems;
        }
      }

      return updatedTransaction;
    });
  }

  async deleteOverride(id: number, user: JwtPayload): Promise<boolean> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Kiểm tra sự tồn tại của giao dịch và quyền sở hữu
      const transaction = await manager.findOne(FinancialTransactionEntity, {
        where: { id, account: { id: user.sub } },
        relations: ["wallet"],
      });

      if (!transaction) {
        throw new NotFoundException("Transaction not found");
      }

      // 2. Lock ví nguồn để tránh race condition khi cập nhật lại số dư
      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: transaction.wallet.id },
        lock: { mode: "pessimistic_write" },
      });

      if (!wallet) {
        throw new NotFoundException("Associated wallet not found");
      }

      const amount = Number(transaction.amount);
      let currentBalance = Number(wallet.balance);

      // 3. Hoàn tiền lại ví theo loại giao dịch (Đảo ngược ảnh hưởng)
      switch (transaction.type) {
        case FINANCIAL_TRANSACTION_TYPE.EXPENSE:
          // Hoàn lại tiền đã chi tiêu
          currentBalance += amount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.INCOME:
        case FINANCIAL_TRANSACTION_TYPE.REFUND:
        case FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT:
          // Trừ lại tiền đã cộng trước đó
          currentBalance -= amount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.TRANSFER:
          // Hoàn lại tiền cho ví nguồn gốc
          currentBalance += amount;
          break;

        default:
          break;
      }

      wallet.balance = currentBalance;
      await manager.save(wallet);

      // 4. Xóa các Transaction Items liên quan (nếu CASCADE trên DB chưa cấu hình)
      await manager.delete(FinancialTransactionItemEntity, {
        transactionId: id,
      });

      // 5. Xóa chính bản ghi Transaction
      await manager.remove(transaction);

      return true;
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
