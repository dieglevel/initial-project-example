import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";
import type { FinancialTransaction_Create_Request } from "./dto/create.dto";
import type { FinancialTransaction_GetWithDate_Request } from "./dto/get-with-date.dto";
import type { FinancialTransaction_GetAll_Response } from "./dto/get-all.dto";
import dayjs from "dayjs";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FINANCIAL_TRANSACTION_TYPE } from "./financial-transaction.enum";
import type { JwtPayload } from "@/module/auth/payload.type";

@Injectable()
export class FinancialTransactionService extends BaseCrudService<FinancialTransactionEntity> {
  constructor(
    @InjectRepository(FinancialTransactionEntity)
    private readonly FinancialTransactionRepository: Repository<FinancialTransactionEntity>,

    @InjectRepository(FinancialWalletEntity)
    private readonly FinancialWalletRepository: Repository<FinancialWalletEntity>,

    private readonly dataSource: DataSource,
  ) {
    super(FinancialTransactionRepository);
  }

  async createOverride(
    dto: FinancialTransaction_Create_Request,
    user: JwtPayload,
  ): Promise<FinancialTransactionEntity> {
    const { walletId, categoryId, ...transactionData } = dto;

    return await this.dataSource.transaction(async (manager) => {
      // Lock wallet để tránh race condition khi nhiều giao dịch cùng lúc
      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: {
          id: walletId,
        },
        lock: {
          mode: "pessimistic_write",
        },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const amount = Number(transactionData.amount);
      const currentBalance = Number(wallet.balance);

      // Update wallet balance
      switch (transactionData.type) {
        case FINANCIAL_TRANSACTION_TYPE.EXPENSE:
          if (currentBalance < amount) {
            throw new Error("Insufficient balance in the wallet");
          }

          wallet.balance = currentBalance - amount;
          break;

        case FINANCIAL_TRANSACTION_TYPE.INCOME:
          wallet.balance = currentBalance + amount;
          break;

        default:
          throw new Error("Invalid transaction type");
      }

      // Tạo transaction
      const transaction = manager.create(FinancialTransactionEntity, {
        ...transactionData,
        wallet: wallet,
        ...(categoryId
          ? {
              category: {
                id: categoryId,
              },
            }
          : {}),
        createdAt: transactionData.date,
        account: {
          id: user.sub,
        },
      });

      // Save trong cùng transaction
      await manager.save(wallet);

      return await manager.save(transaction);
    });
  }

  async getByDate({
    date,
  }: FinancialTransaction_GetWithDate_Request): Promise<
    FinancialTransaction_GetAll_Response[]
  > {
    const targetDate = dayjs(date);

    const startDate = targetDate.startOf("month").toDate();

    const endDate = targetDate.endOf("month").toDate();

    return this.FinancialTransactionRepository.createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.wallet", "wallet")
      .leftJoinAndSelect("transaction.category", "category")
      .leftJoinAndSelect(
        "transaction.financialAdvanceTransactions",
        "advanceTransaction",
      )
      .where("transaction.createdAt BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      })
      .orderBy("transaction.createdAt", "DESC")
      .getMany();
  }
}
