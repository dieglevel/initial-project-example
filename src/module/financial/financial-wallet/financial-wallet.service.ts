import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { FinancialWalletEntity } from "./_entities/financial-wallet.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";
import type { FinancialWallet_GetWithTransactionCount_Response } from "./dto/get-with-transaction-count.dto";
import type {
  FinancialWallet_Transfer_Request,
  FinancialWallet_Transfer_Response,
} from "./dto/transfer.dto";
import { FinancialWalletTransferService } from "../financial-wallet-transfer/financial-wallet-transfer.service";
import crypto from "node:crypto";

@Injectable()
export class FinancialWalletService extends BaseCrudService<FinancialWalletEntity> {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(FinancialWalletEntity)
    private readonly FinancialWalletRepository: Repository<FinancialWalletEntity>,

    private readonly financialWalletTransferService: FinancialWalletTransferService,
  ) {
    super(FinancialWalletRepository);
  }

  async getWalletsWithTotals(): Promise<
    FinancialWallet_GetWithTransactionCount_Response[]
  > {
    const queryBuilder = this.FinancialWalletRepository.createQueryBuilder(
      "financialWallet",
    )
      .leftJoin("financialWallet.transactions", "transaction")
      .select("financialWallet")
      .addSelect("COALESCE(SUM(transaction.amount), 0)", "totalAmount")
      .groupBy("financialWallet.id");

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((entity, index) => {
      const totalAmount = Number(
        (raw[index] as { totalAmount?: string | number | null })?.totalAmount,
      );
      const result: FinancialWallet_GetWithTransactionCount_Response = {
        ...entity,
        totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      };
      return result;
    });
  }

  async transferBetweenWallets({
    amount,
    fromWalletId,
    toWalletId,
    transferFee = 0,
  }: FinancialWallet_Transfer_Request): Promise<FinancialWallet_Transfer_Response> {
    return await this.dataSource.transaction(async (entityManager) => {
      const fromWallet = await entityManager.findOne(FinancialWalletEntity, {
        where: { id: fromWalletId },
        lock: { mode: "pessimistic_write" }, // Chống Race Condition
      });

      const toWallet = await entityManager.findOne(FinancialWalletEntity, {
        where: { id: toWalletId },
        lock: { mode: "pessimistic_write" },
      });

      if (!fromWallet || !toWallet) {
        throw new NotFoundException("One or both wallets not found");
      }

      const totalDeduction = amount + transferFee;
      if (fromWallet.balance < totalDeduction) {
        throw new BadRequestException(
          "Insufficient balance in the source wallet",
        );
      }

      fromWallet.balance -= totalDeduction;
      toWallet.balance += amount;

      await entityManager.save(FinancialWalletEntity, [fromWallet, toWallet]);

      await this.financialWalletTransferService.createTransfer(
        {
          fromWallet,
          toWallet,
          amount,
          transferFee,
        },
        entityManager,
      );

      return { message: "Transfer completed successfully" };
    });
  }

  async findByApiKey(apiKey: string): Promise<FinancialWalletEntity | null> {
    if (!apiKey) return null;
    return this.FinancialWalletRepository.findOne({
      where: { apiKey },
      relations: ["account"],
    });
  }

  async generateApiKey(walletId: number): Promise<{ apiKey: string }> {
    const wallet = await this.FinancialWalletRepository.findOne({
      where: { id: walletId },
    });
    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }
    const newApiKey = `wapi_${crypto.randomBytes(16).toString("hex")}`;
    wallet.apiKey = newApiKey;
    await this.FinancialWalletRepository.save(wallet);
    return { apiKey: newApiKey };
  }
}
