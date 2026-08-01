import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { FinancialAdvanceTransactionEntity } from "./_entities/financial-advance-transaction.entity";
import type { JwtPayload } from "@/module/auth/payload.type";
import type { FinancialAdvanceTransaction_Create_Request } from "./dto/create.dto";
import { FinancialTransactionEntity } from "../_entities/financial-transaction.entity";
import { FinancialWalletEntity } from "../../financial-wallet/_entities/financial-wallet.entity";
import { FINANCIAL_TRANSACTION_TYPE } from "../financial-transaction.enum";

@Injectable()
export class FinancialAdvanceTransactionService {
  constructor(
    @InjectRepository(FinancialAdvanceTransactionEntity)
    private readonly FinancialAdvanceTransactionRepository: Repository<FinancialAdvanceTransactionEntity>,

    private readonly dataSource: DataSource,
  ) {}

  async createAdvanceTransaction(
    dto: FinancialAdvanceTransaction_Create_Request,
    user: JwtPayload,
  ) {
    if (!dto?.data || dto.data.length === 0) {
      throw new BadRequestException(
        "Danh sách giao dịch chi tiết không được để trống",
      );
    }

    // Tự động return kết quả từ transaction ra ngoài
    return await this.dataSource.transaction(async (manager) => {
      // 1. Tính tổng tiền từ danh sách items
      const totalAmount = dto.data.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

      // 2. Khởi tạo Entity cha (Main Transaction)
      const mainTransaction = manager.create(FinancialTransactionEntity, {
        account: { id: user.sub },
        amount: totalAmount,
        type: dto.type,
        description: dto.description,
        categoryId: dto.categoryId,
        walletId: dto.walletId,
        status: dto.status,
        createdAt: dto.date,
      });

      // 3. Lưu Entity cha trước để có ID
      const savedMainTransaction = await manager.save(mainTransaction);

      // 4. Tạo các Entity con và gắn FK transactionId
      const advanceTransactions = dto.data.map((item) => {
        return manager.create(FinancialAdvanceTransactionEntity, {
          amount: item.amount,
          description: item.description,
          createdAt: dto.date,
          transactionId: savedMainTransaction.id, // Liên kết chính xác ID giao dịch cha
        });
      });

      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: dto.walletId },
      });

      if (!wallet) {
        throw new BadRequestException("Ví tài chính không tồn tại");
      }

      if (
        dto.type === FINANCIAL_TRANSACTION_TYPE.INCOME ||
        dto.type === FINANCIAL_TRANSACTION_TYPE.REFUND ||
        dto.type === FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT
      ) {
        wallet.balance += totalAmount;
      } else if (dto.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE) {
        wallet.balance -= totalAmount;
      } else if (dto.type === FINANCIAL_TRANSACTION_TYPE.TRANSFER) {
        throw new BadRequestException(
          "Use financial-wallet transfer endpoint for internal transfers",
        );
      }

      await manager.save(wallet);

      // 5. Lưu danh sách Entity con
      const savedAdvanceTransactions = await manager.save(advanceTransactions);

      // Return kết quả hoàn chỉnh bao gồm cả danh sách con
      return {
        ...savedMainTransaction,
        financialAdvanceTransactions: savedAdvanceTransactions,
      };
    });
  }
}
