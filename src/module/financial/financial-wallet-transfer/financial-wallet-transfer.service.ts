import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, EntityManager, Repository } from "typeorm"; // Import thêm EntityManager
import { FinancialWalletTransferEntity } from "./_entities/financial-wallet-transfer.entity";
import type { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import type { FinancialWalletTransfer_Get_Response } from "./dto/get.dto";
import dayjs from "dayjs";
@Injectable()
export class FinancialWalletTransferService {
  constructor(
    @InjectRepository(FinancialWalletTransferEntity)
    private readonly FinancialWalletTransferRepository: Repository<FinancialWalletTransferEntity>,
  ) {}

  async getWalletTransferHistory(
    date: Date,
  ): Promise<FinancialWalletTransfer_Get_Response[]> {
    const startOfMonth = dayjs(date).startOf("month").toDate();
    const endOfMonth = dayjs(date).endOf("month").toDate();

    return this.FinancialWalletTransferRepository.find({
      relations: {
        fromWallet: true,
        toWallet: true,
      },
      order: {
        createdAt: "DESC",
      },
      where: {
        createdAt: Between(startOfMonth, endOfMonth),
      },
    });
  }

  async createTransfer(
    data: {
      fromWallet: FinancialWalletEntity;
      toWallet: FinancialWalletEntity;
      amount: number;
      transferFee: number;
    },
    manager?: EntityManager,
  ): Promise<FinancialWalletTransferEntity> {
    const repo = manager
      ? manager.getRepository(FinancialWalletTransferEntity)
      : this.FinancialWalletTransferRepository;

    const transfer = repo.create({
      fromWallet: data.fromWallet,
      toWallet: data.toWallet,
      amount: data.amount,
      transferFee: data.transferFee,
    });

    return repo.save(transfer);
  }
}
