import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm"; // Import thêm EntityManager
import { FinancialWalletTransferEntity } from "./_entities/financial-wallet-transfer.entity";
import type { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import type { FinancialWalletTransfer_Get_Response } from "./dto/get";

@Injectable()
export class FinancialWalletTransferService {
  constructor(
    @InjectRepository(FinancialWalletTransferEntity)
    private readonly FinancialWalletTransferRepository: Repository<FinancialWalletTransferEntity>,
  ) {}

  async getWalletTransferHistory(): Promise<
    FinancialWalletTransfer_Get_Response[]
  > {
    return await this.FinancialWalletTransferRepository.find({
      relations: {
        fromWallet: true,
        toWallet: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async createTransfer(
    fromWallet: FinancialWalletEntity,
    toWallet: FinancialWalletEntity,
    amount: number,
    transferFee: number,
    manager?: EntityManager,
  ): Promise<FinancialWalletTransferEntity> {
    const repo = manager
      ? manager.getRepository(FinancialWalletTransferEntity)
      : this.FinancialWalletTransferRepository;

    const transfer = repo.create({
      fromWallet: fromWallet,
      toWallet: toWallet,
      amount,
      transferFee,
    });

    return repo.save(transfer);
  }
}
