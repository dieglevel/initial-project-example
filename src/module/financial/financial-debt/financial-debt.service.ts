import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager } from "typeorm";

import { FinancialDebtEntity } from "./_entities/financial-debt.entity";
import { FinancialDebtHistoryEntity } from "./_entities/financial-debt-history.entity";
import {
  FINANCIAL_DEBT_DIRECTION_ENUM,
  FINANCIAL_DEBT_STATUS_ENUM,
} from "./financial-debt.enum";
import { FINANCIAL_DEBT_HISTORY_TYPE_ENUM } from "./financial-debt-history.enum";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";

@Injectable()
export class FinancialDebtService extends BaseCrudService<FinancialDebtEntity> {
  constructor(
    @InjectRepository(FinancialDebtEntity)
    private readonly financialDebtRepository: Repository<FinancialDebtEntity>,

    @InjectRepository(FinancialDebtHistoryEntity)
    private readonly financialDebtHistoryRepository: Repository<FinancialDebtHistoryEntity>,

    @InjectRepository(FinancialWalletEntity)
    private readonly financialWalletRepository: Repository<FinancialWalletEntity>,

    private readonly dataSource: DataSource,
  ) {
    super(financialDebtRepository);
  }

  /**
   * Tạo khoản nợ mới & biến động số dư Ví tương ứng
   */
  async create(data: Partial<FinancialDebtEntity> & { walletId: number }) {
    // 1. Validation & Type Narrowing
    const { originalAmount, walletId, accountId, direction } = data;

    if (!originalAmount || originalAmount <= 0) {
      throw new BadRequestException("Original amount must be greater than 0");
    }

    if (!walletId) {
      throw new BadRequestException("walletId is required to create a debt");
    }

    // Tại đây TypeScript đã hiểu originalAmount chắc chắn là number (không undefined/null)

    return this.dataSource.transaction(async (manager) => {
      // 2. Kiểm tra Ví
      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: walletId, account: { id: accountId } },
      });

      if (!wallet) {
        throw new NotFoundException("Financial wallet not found");
      }

      // 3. Cập nhật số dư Wallet khi THANH TOÁN / THU HỒI NỢ
      if (direction === FINANCIAL_DEBT_DIRECTION_ENUM.OUTGOING) {
        // Trả nợ -> Tiền ra khỏi ví
        if (wallet.balance < originalAmount) {
          throw new BadRequestException("Insufficient wallet balance");
        }
        wallet.balance -= originalAmount;
      } else if (direction === FINANCIAL_DEBT_DIRECTION_ENUM.INCOMING) {
        // Thu nợ -> Tiền vào ví
        wallet.balance += originalAmount;
      }

      // 4. Tạo khoản nợ
      const debt = manager.create(FinancialDebtEntity, {
        ...data,
        outstandingAmount: originalAmount,
        status: FINANCIAL_DEBT_STATUS_ENUM.ACTIVE,
      });

      await manager.save(wallet);
      const savedDebt = await manager.save(debt);

      // 5. Ghi lịch sử
      await this.createHistoryWithManager(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.CREATED,
        amount: savedDebt.originalAmount,
        previousOutstandingAmount: 0,
        outstandingAmount: savedDebt.outstandingAmount,
      });

      return savedDebt;
    });
  }

  /**
   * Thanh toán nợ (Trọng phần hoặc toàn phần)
   */
  async payment(
    id: number,
    accountId: number,
    walletId: number,
    amount: number,
    note?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException("Payment amount must be greater than 0");
    }

    return this.dataSource.transaction(async (manager) => {
      const debt = await manager.findOne(FinancialDebtEntity, {
        where: { id, accountId },
      });

      if (!debt) {
        throw new NotFoundException("Financial debt not found");
      }

      this.validateActiveDebt(debt);

      if (amount > debt.outstandingAmount) {
        throw new BadRequestException(
          "Payment amount cannot exceed outstanding amount",
        );
      }

      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: walletId, account: { id: accountId } },
      });

      if (!wallet) {
        throw new NotFoundException("Financial wallet not found");
      }

      // Biến động số dư ví khi Thanh toán:
      // - OUTGOING (Đi vay -> Trả nợ -> TRỪ tiền trong ví)
      // - INCOMING (Cho vay -> Thu nợ -> CỘNG tiền vào ví)
      if (debt.direction === FINANCIAL_DEBT_DIRECTION_ENUM.OUTGOING) {
        if (wallet.balance < amount) {
          throw new BadRequestException("Insufficient wallet balance");
        }
        wallet.balance -= amount;
      } else if (debt.direction === FINANCIAL_DEBT_DIRECTION_ENUM.INCOMING) {
        wallet.balance += amount;
      }

      const previousOutstandingAmount = debt.outstandingAmount;
      debt.outstandingAmount -= amount;

      if (debt.outstandingAmount === 0) {
        debt.status = FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF;
      }

      await manager.save(wallet);
      const savedDebt = await manager.save(debt);

      await this.createHistoryWithManager(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.PAYMENT,
        amount,
        previousOutstandingAmount,
        outstandingAmount: savedDebt.outstandingAmount,
        note,
      });

      return savedDebt;
    });
  }

  /**
   * Điều chỉnh số dư nợ thủ công
   */
  async adjust(
    id: number,
    accountId: number,
    outstandingAmount: number,
    note?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const debt = await manager.findOne(FinancialDebtEntity, {
        where: { id, accountId },
      });

      if (!debt) {
        throw new NotFoundException("Financial debt not found");
      }

      this.validateActiveDebt(debt);

      if (outstandingAmount < 0) {
        throw new BadRequestException("Outstanding amount cannot be negative");
      }

      const previousOutstandingAmount = debt.outstandingAmount;
      debt.outstandingAmount = outstandingAmount;

      if (outstandingAmount === 0) {
        debt.status = FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF;
      } else {
        debt.status = FINANCIAL_DEBT_STATUS_ENUM.ACTIVE;
      }

      const savedDebt = await manager.save(debt);

      await this.createHistoryWithManager(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.ADJUSTMENT,
        amount: Math.abs(outstandingAmount - previousOutstandingAmount),
        previousOutstandingAmount,
        outstandingAmount,
        note,
      });

      return savedDebt;
    });
  }

  /**
   * Tất toán / Miễn nợ (Không làm thay đổi tiền trong Ví)
   */
  async settle(id: number, accountId: number, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const debt = await manager.findOne(FinancialDebtEntity, {
        where: { id, accountId },
      });

      if (!debt) {
        throw new NotFoundException("Financial debt not found");
      }

      this.validateActiveDebt(debt);

      const previousOutstandingAmount = debt.outstandingAmount;

      debt.outstandingAmount = 0;
      debt.status = FINANCIAL_DEBT_STATUS_ENUM.SETTLED;

      const savedDebt = await manager.save(debt);

      await this.createHistoryWithManager(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.SETTLED,
        amount: previousOutstandingAmount,
        previousOutstandingAmount,
        outstandingAmount: 0,
        note,
      });

      return savedDebt;
    });
  }

  /**
   * Hủy khoản nợ
   */
  async cancel(id: number, accountId: number, note?: string) {
    return this.dataSource.transaction(async (manager) => {
      const debt = await manager.findOne(FinancialDebtEntity, {
        where: { id, accountId },
      });

      if (!debt) {
        throw new NotFoundException("Financial debt not found");
      }

      if (debt.status === FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF) {
        throw new BadRequestException("Paid off debt cannot be cancelled");
      }

      if (debt.status === FINANCIAL_DEBT_STATUS_ENUM.CANCELLED) {
        throw new BadRequestException("Debt is already cancelled");
      }

      const previousOutstandingAmount = debt.outstandingAmount;

      debt.status = FINANCIAL_DEBT_STATUS_ENUM.CANCELLED;

      const savedDebt = await manager.save(debt);

      await this.createHistoryWithManager(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.CANCELLED,
        amount: 0,
        previousOutstandingAmount,
        outstandingAmount: previousOutstandingAmount,
        note,
      });

      return savedDebt;
    });
  }

  /**
   * Lấy lịch sử nợ
   */
  async getHistories(id: number, accountId: number) {
    await this.findOne(id, accountId);

    return this.financialDebtHistoryRepository.find({
      where: { debtId: id },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Helper tạo history trong Transaction
   */
  private async createHistoryWithManager(
    manager: EntityManager,
    data: Partial<FinancialDebtHistoryEntity>,
  ) {
    const history = manager.create(FinancialDebtHistoryEntity, data);
    return manager.save(history);
  }

  /**
   * Validate trạng thái nợ
   */
  private validateActiveDebt(debt: FinancialDebtEntity) {
    if (debt.status !== FINANCIAL_DEBT_STATUS_ENUM.ACTIVE) {
      throw new BadRequestException("Debt is not active");
    }

    if (debt.outstandingAmount <= 0) {
      throw new BadRequestException("Debt has no outstanding amount");
    }
  }
}
