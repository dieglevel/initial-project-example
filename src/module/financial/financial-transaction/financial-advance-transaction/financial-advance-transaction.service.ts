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

    return await this.dataSource.transaction(async (manager) => {
      // 1. Tìm ví tài chính & Kiểm tra sự tồn tại
      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: dto.walletId },
      });

      if (!wallet) {
        throw new BadRequestException("Ví tài chính không tồn tại");
      }

      // 2. Tính tổng tiền từ danh sách items
      const totalAmount = dto.data.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

      // 3. Khởi tạo Entity giao dịch chính (Main Transaction)
      const mainTransaction = manager.create(FinancialTransactionEntity, {
        account: { id: user.sub },
        amount: totalAmount,
        type: dto.type,
        description: dto.description,
        walletId: dto.walletId,
        status: dto.status,
        merchant: dto.merchant,
        location: dto.location,
        receiptImageUrl: dto.receiptImageUrl,
        originalTransactionId: dto.originalTransactionId,
        date: dto.date, // Gán cho trường date thay vì createdAt
      });

      // 4. Lưu giao dịch chính
      const savedMainTransaction = await manager.save(mainTransaction);

      // 5. Tạo các khoản chi tiết (Advance Transactions) kèm categoryId
      const advanceTransactions = dto.data.map((item) => {
        return manager.create(FinancialAdvanceTransactionEntity, {
          amount: Number(item.amount),
          description: item.description,
          categoryId: item.categoryId ? Number(item.categoryId) : undefined, // Gán categoryId từng dòng
          transactionId: savedMainTransaction.id,
        });
      });

      // Lưu danh sách chi tiết
      const savedAdvanceTransactions = await manager.save(advanceTransactions);

      // 6. Cập nhật Số dư Ví (Ép kiểu Number an toàn)
      const currentBalance = Number(wallet.balance || 0);

      if (
        dto.type === FINANCIAL_TRANSACTION_TYPE.INCOME ||
        dto.type === FINANCIAL_TRANSACTION_TYPE.REFUND ||
        dto.type === FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT
      ) {
        wallet.balance = currentBalance + totalAmount;
      } else if (dto.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE) {
        wallet.balance = currentBalance - totalAmount;
      } else if (dto.type === FINANCIAL_TRANSACTION_TYPE.TRANSFER) {
        throw new BadRequestException(
          "Vui lòng sử dụng tính năng Chuyển tiền giữa các ví",
        );
      }

      await manager.save(wallet);

      // Trả về kết quả hoàn chỉnh
      return {
        ...savedMainTransaction,
        financialAdvanceTransactions: savedAdvanceTransactions,
      };
    });
  }
}
