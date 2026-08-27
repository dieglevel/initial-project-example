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
import type {
  FinancialTransaction_GetAll_Request,
  FinancialTransaction_Paging_Response,
} from "./dto/paging.dto";

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

      const rawToWalletId = (dto as { toWalletId?: unknown }).toWalletId;
      const normalizedToWalletId =
        typeof rawToWalletId === "number" ? rawToWalletId : undefined;

      // 2. Tính lại tổng amount từ items nếu có
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

      const updatedData = {
        walletId: dto.walletId ?? oldTransaction.wallet.id,
        toWalletId: normalizedToWalletId,
        amount: calculatedAmount,
        type: dto.type ?? oldTransaction.type,
        status: dto.status ?? oldTransaction.status, // Thêm status mới
        transferFee:
          dto.transferFee !== undefined ? Number(dto.transferFee) : 0,
      };

      // 3. Lock tất cả ví liên quan
      const oldToWalletId = (
        oldTransaction as unknown as { toWalletId?: number }
      ).toWalletId;

      const walletIdsToLock = Array.from(
        new Set(
          [
            oldTransaction.wallet.id,
            oldToWalletId,
            updatedData.walletId,
            updatedData.toWalletId,
          ].filter((wId): wId is number => Boolean(wId)),
        ),
      );

      const wallets = await manager.find(FinancialWalletEntity, {
        where: walletIdsToLock.map((wId) => ({ id: wId })),
        lock: { mode: "pessimistic_write" },
      });

      const walletMap = new Map(wallets.map((w) => [w.id, w]));

      // ----------------------------------------------------
      // STEP A: ROLLBACK GIAO DỊCH CŨ (Chỉ làm khi cũ = COMPLETED)
      // ----------------------------------------------------
      if (oldTransaction.status === FINANCIAL_TRANSACTION_STATUS.COMPLETED) {
        const oldWallet = walletMap.get(oldTransaction.wallet.id);
        if (!oldWallet)
          throw new NotFoundException("Old source wallet not found");

        const oldAmount = Number(oldTransaction.amount);

        switch (oldTransaction.type) {
          case FINANCIAL_TRANSACTION_TYPE.EXPENSE:
            oldWallet.balance = Number(oldWallet.balance) + oldAmount;
            break;

          case FINANCIAL_TRANSACTION_TYPE.INCOME:
          case FINANCIAL_TRANSACTION_TYPE.REFUND:
          case FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT:
            oldWallet.balance = Number(oldWallet.balance) - oldAmount;
            break;

          case FINANCIAL_TRANSACTION_TYPE.TRANSFER: {
            oldWallet.balance = Number(oldWallet.balance) + oldAmount;
            if (oldToWalletId) {
              const oldTargetWallet = walletMap.get(oldToWalletId);
              if (oldTargetWallet) {
                oldTargetWallet.balance =
                  Number(oldTargetWallet.balance) - oldAmount;
              }
            }
            break;
          }
        }
      }

      // ----------------------------------------------------
      // STEP B: APPLY GIAO DỊCH MỚI (Chỉ trừ/cộng tiền khi mới = COMPLETED)
      // ----------------------------------------------------
      if (updatedData.status === FINANCIAL_TRANSACTION_STATUS.COMPLETED) {
        const newWallet = walletMap.get(updatedData.walletId);
        if (!newWallet)
          throw new NotFoundException("New source wallet not found");

        const newAmount = updatedData.amount;
        const currentNewBalance = Number(newWallet.balance);

        switch (updatedData.type) {
          case FINANCIAL_TRANSACTION_TYPE.EXPENSE:
            if (currentNewBalance < newAmount) {
              throw new BadRequestException("Insufficient wallet balance");
            }
            newWallet.balance = currentNewBalance - newAmount;
            break;

          case FINANCIAL_TRANSACTION_TYPE.INCOME:
          case FINANCIAL_TRANSACTION_TYPE.REFUND:
          case FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT:
            newWallet.balance = currentNewBalance + newAmount;
            break;

          case FINANCIAL_TRANSACTION_TYPE.TRANSFER: {
            if (!updatedData.toWalletId) {
              throw new BadRequestException(
                "Destination wallet (toWalletId) is required",
              );
            }
            if (updatedData.walletId === updatedData.toWalletId) {
              throw new BadRequestException(
                "Cannot transfer to the same wallet",
              );
            }

            const targetWallet = walletMap.get(updatedData.toWalletId);
            if (!targetWallet)
              throw new NotFoundException("Destination wallet not found");

            const totalDeduction = newAmount + updatedData.transferFee;
            if (currentNewBalance < totalDeduction) {
              throw new BadRequestException(
                "Insufficient wallet balance for transfer",
              );
            }

            newWallet.balance = currentNewBalance - totalDeduction;
            targetWallet.balance = Number(targetWallet.balance) + newAmount;
            break;
          }

          default:
            throw new BadRequestException("Invalid transaction type");
        }
      }

      // Luôn lưu lại ví nếu có bất kỳ sự thay đổi số dư nào ở Step A hoặc Step B
      await manager.save(Array.from(walletMap.values()));

      // ----------------------------------------------------
      // STEP C: CẬP NHẬT TRANSACTION & ITEMS
      // ----------------------------------------------------
      const {
        financialTransactionItems,
        walletId,
        toWalletId,
        date,
        amount,
        type,
        status,
        ...otherFields
      } = dto;

      Object.assign(oldTransaction, {
        ...otherFields,
        amount: updatedData.amount,
        type: updatedData.type,
        status: updatedData.status, // Cập nhật status mới vào DB
        wallet: walletMap.get(updatedData.walletId),
        walletId: updatedData.walletId,
        ...(date !== undefined && { createdAt: new Date(String(date)) }),
      });

      const updatedTransaction = await manager.save(oldTransaction);

      // Cập nhật Items nếu có
      if (financialTransactionItems !== undefined) {
        await manager.delete(FinancialTransactionItemEntity, {
          transactionId: id,
        });

        if (financialTransactionItems.length > 0) {
          const newItems = financialTransactionItems.map((item) =>
            manager.create(FinancialTransactionItemEntity, {
              description: item.description,
              amount: Number(item.amount),
              categoryId: item.categoryId ? Number(item.categoryId) : undefined,
              transactionId: id,
            }),
          );
          const savedItems = await manager.save(newItems);
          updatedTransaction.financialTransactionItems = savedItems;
        } else {
          updatedTransaction.financialTransactionItems = [];
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

  async get({
    query,
    user,
  }: {
    query: FinancialTransaction_GetAll_Request;
    user: JwtPayload;
  }): Promise<FinancialTransaction_Paging_Response> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = query;

    const { type, status, walletId, minAmount, maxAmount, fromDate, toDate } =
      query.filter || {};

    const search = query.search?.trim() || undefined;

    // 1. Khởi tạo QueryBuilder cơ bản
    const queryBuilder = this.financialTransactionRepository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.wallet", "wallet")
      .leftJoinAndSelect(
        "transaction.financialTransactionItems",
        "financialTransactionItems",
      )
      .leftJoinAndSelect("financialTransactionItems.category", "category")
      .where("transaction.accountId = :accountId", { accountId: user.sub });

    // 2. Thêm các điều kiện lọc linh hoạt (Filter)
    if (search) {
      queryBuilder.andWhere(
        "(transaction.description ILIKE :search OR transaction.merchant ILIKE :search OR transaction.location ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere("transaction.type = :type", { type });
    }

    if (status) {
      queryBuilder.andWhere("transaction.status = :status", { status });
    }

    if (walletId) {
      queryBuilder.andWhere("transaction.walletId = :walletId", { walletId });
    }

    if (minAmount !== undefined) {
      queryBuilder.andWhere("transaction.amount >= :minAmount", { minAmount });
    }

    if (maxAmount !== undefined) {
      queryBuilder.andWhere("transaction.amount <= :maxAmount", { maxAmount });
    }

    // Lọc theo thời gian (Từ ngày - Đến ngày)
    if (fromDate) {
      const start = dayjs(fromDate).startOf("day").toDate();
      queryBuilder.andWhere("transaction.createdAt >= :start", { start });
    }

    if (toDate) {
      const end = dayjs(toDate).endOf("day").toDate();
      queryBuilder.andWhere("transaction.createdAt <= :end", { end });
    }

    // 3. Tính tổng Income/Expense TRƯỚC KHI phân trang (trên toàn bộ danh sách đã filter)
    const allFilteredTransactions = await queryBuilder.getMany();
    const totals = allFilteredTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE) {
          acc.totalExpense += Number(transaction.amount || 0);
        } else if (transaction.type === FINANCIAL_TRANSACTION_TYPE.INCOME) {
          acc.totalIncome += Number(transaction.amount || 0);
        }
        return acc;
      },
      { totalExpense: 0, totalIncome: 0 },
    );

    // 4. Áp dụng Sắp xếp & Phân trang
    queryBuilder.orderBy(`transaction.${sortBy}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // 5. Lấy kết quả phân trang và tổng số bản ghi
    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      data: transactions,
      totalExpense: totals.totalExpense,
      totalIncome: totals.totalIncome,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
      .leftJoinAndSelect(
        "transaction.originalTransaction",
        "originalTransaction",
      )
      .leftJoinAndSelect(
        "originalTransaction.financialTransactionItems",
        "originalTransactionItems",
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
