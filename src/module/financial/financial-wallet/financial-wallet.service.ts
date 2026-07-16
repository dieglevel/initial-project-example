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
import { FINANCIAL_WALLET_TYPE } from "./financial-wallet.enum";
import { FinancialWalletTransferService } from "../financial-wallet-transfer/financial-wallet-transfer.service";

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

      return {
        ...entity,
        totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      };
    });
  }

  async transferBetweenWallets({
    amount,
    fromWalletId,
    toWalletId,
    transferFee = 0, // Đảm bảo luôn có giá trị mặc định nếu FE không gửi
  }: FinancialWallet_Transfer_Request): Promise<FinancialWallet_Transfer_Response> {
    // Sử dụng transaction để bao bọc toàn bộ chu trình chuyển tiền
    return await this.dataSource.transaction(async (entityManager) => {
      // 1. Tìm và KHÓA (Lock) bản ghi ví gửi để ngăn các request khác sửa đổi cùng lúc
      const fromWallet = await entityManager.findOne(FinancialWalletEntity, {
        where: { id: fromWalletId },
        lock: { mode: "pessimistic_write" }, // Chống Race Condition
      });

      // 2. Tìm và KHÓA bản ghi ví nhận
      const toWallet = await entityManager.findOne(FinancialWalletEntity, {
        where: { id: toWalletId },
        lock: { mode: "pessimistic_write" },
      });

      // 3. Kiểm tra sự tồn tại (Sử dụng NestJS Built-in Exception thay vì Error thuần)
      if (!fromWallet || !toWallet) {
        throw new NotFoundException("One or both wallets not found");
      }

      // 4. Kiểm tra số dư (Nhớ tính cả phí chuyển tiền nếu có)
      const totalDeduction = amount + transferFee;
      if (fromWallet.balance < totalDeduction) {
        throw new BadRequestException(
          "Insufficient balance in the source wallet",
        );
      }

      // 6. Thực hiện trừ/cộng tiền
      fromWallet.balance -= totalDeduction;
      toWallet.balance += amount;

      // TODO: Nếu transferFee > 0 và phí này chạy vào ví của hệ thống,
      // bạn cần cộng tiền phí đó vào ví hệ thống (System Wallet) ở đây.

      // 7. Lưu lại thông qua entityManager của transaction
      await entityManager.save(FinancialWalletEntity, [fromWallet, toWallet]);

      await this.financialWalletTransferService.createTransfer(
        fromWallet,
        toWallet,
        amount,
        transferFee,
        entityManager,
      );

      return { message: "Transfer completed successfully" };
    });
  }
}
