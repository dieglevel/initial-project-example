import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

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
   * Create debt
   */
  async create(data: Partial<FinancialDebtEntity>) {
    const debt = this.financialDebtRepository.create({
      ...data,
      outstandingAmount: data.originalAmount,
      status: FINANCIAL_DEBT_STATUS_ENUM.ACTIVE,
    });

    const savedDebt = await this.financialDebtRepository.save(debt);

    await this.createHistory({
      debtId: savedDebt.id,
      type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.CREATED,
      amount: savedDebt.originalAmount,
      previousOutstandingAmount: 0,
      outstandingAmount: savedDebt.outstandingAmount,
    });

    return savedDebt;
  }

  /**
   * Get all debts
   */
  async findAll(
    param: number | { where: Record<string, any> },
  ): Promise<FinancialDebtEntity[]> {
    let whereCondition: Record<string, any> = {};

    if (typeof param === "number") {
      whereCondition = { accountId: param };
    } else if (param && typeof param === "object" && param.where) {
      whereCondition = param.where;
    }

    return this.financialDebtRepository.find({
      where: whereCondition,
      order: {
        createdAt: "DESC",
      },
    });
  }

  /**
   * Get debt by id
   */
  async findOne(id: number, accountId: number) {
    const debt = await this.financialDebtRepository.findOne({
      where: {
        id,
        accountId,
      },
    });

    if (!debt) {
      throw new NotFoundException("Financial debt not found");
    }

    return debt;
  }

  /**
   * Update basic debt information
   */
  async updateOverride(
    id: number,
    accountId: number,
    data: Partial<FinancialDebtEntity>,
  ) {
    const debt = await this.findOne(id, accountId);

    if (
      debt.status === FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF ||
      debt.status === FINANCIAL_DEBT_STATUS_ENUM.CANCELLED
    ) {
      throw new BadRequestException(
        "Cannot update a completed or cancelled debt",
      );
    }

    Object.assign(debt, data);

    return this.financialDebtRepository.save(debt);
  }

  /**
   * Payment
   *
   * Only updates debt here.
   * FinancialTransaction should be handled in the same DB transaction
   * by the financial transaction service.
   */
  async payment(
    id: number,
    accountId: number,
    walletId: number, // Bổ sung walletId
    amount: number,
    note?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException("Payment amount must be greater than 0");
    }

    // Thực hiện trong 1 Transaction duy nhất
    return this.dataSource.transaction(async (manager) => {
      // 1. Kiểm tra khoản nợ
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

      // 2. Kiểm tra Ví
      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: walletId, account: { id: accountId } },
      });

      if (!wallet) {
        throw new NotFoundException("Financial wallet not found");
      }

      // 3. Tính toán và biến động số dư Ví
      // - BORROWED (Mình đi vay -> Trả nợ -> TRỪ tiền trong ví)
      // - LENT (Cho người khác vay -> Thu nợ -> CỘNG tiền vào ví)
      if (debt.direction === FINANCIAL_DEBT_DIRECTION_ENUM.OUTGOING) {
        if (wallet.balance < amount) {
          throw new BadRequestException("Insufficient wallet balance");
        }
        wallet.balance -= amount;
      } else if (debt.direction === FINANCIAL_DEBT_DIRECTION_ENUM.INCOMING) {
        wallet.balance += amount;
      }

      // 4. Cập nhật khoản nợ
      const previousOutstandingAmount = debt.outstandingAmount;
      debt.outstandingAmount -= amount;

      if (debt.outstandingAmount === 0) {
        debt.status = FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF;
      }

      // 5. Lưu thông tin vào DB
      await manager.save(wallet);
      const savedDebt = await manager.save(debt);

      // 6. Ghi lịch sử
      const history = manager.create(FinancialDebtHistoryEntity, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.PAYMENT,
        amount,
        previousOutstandingAmount,
        outstandingAmount: savedDebt.outstandingAmount,
        note,
      });
      await manager.save(history);

      return savedDebt;
    });
  }

  /**
   * Adjust outstanding amount
   *
   * Example:
   *
   * 1.500.000 -> 1.400.000
   */
  async adjust(
    id: number,
    accountId: number,
    outstandingAmount: number,
    note?: string,
  ) {
    const debt = await this.findOne(id, accountId);

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

    const savedDebt = await this.financialDebtRepository.save(debt);

    await this.createHistory({
      debtId: savedDebt.id,
      type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.ADJUSTMENT,
      amount: Math.abs(outstandingAmount - previousOutstandingAmount),
      previousOutstandingAmount,
      outstandingAmount,
      note,
    });

    return savedDebt;
  }

  /**
   * Settle debt
   *
   * Used when both parties agree to close the debt
   * without necessarily paying the entire outstanding amount.
   */
  async settle(id: number, accountId: number, note?: string) {
    const debt = await this.findOne(id, accountId);

    this.validateActiveDebt(debt);

    const previousOutstandingAmount = debt.outstandingAmount;

    debt.outstandingAmount = 0;
    debt.status = FINANCIAL_DEBT_STATUS_ENUM.SETTLED;

    const savedDebt = await this.financialDebtRepository.save(debt);

    await this.createHistory({
      debtId: savedDebt.id,
      type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.SETTLED,
      amount: previousOutstandingAmount,
      previousOutstandingAmount,
      outstandingAmount: 0,
      note,
    });

    return savedDebt;
  }

  /**
   * Cancel debt
   */
  async cancel(id: number, accountId: number, note?: string) {
    const debt = await this.findOne(id, accountId);

    if (debt.status === FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF) {
      throw new BadRequestException("Paid off debt cannot be cancelled");
    }

    if (debt.status === FINANCIAL_DEBT_STATUS_ENUM.CANCELLED) {
      throw new BadRequestException("Debt is already cancelled");
    }

    const previousOutstandingAmount = debt.outstandingAmount;

    debt.status = FINANCIAL_DEBT_STATUS_ENUM.CANCELLED;

    const savedDebt = await this.financialDebtRepository.save(debt);

    await this.createHistory({
      debtId: savedDebt.id,
      type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.CANCELLED,
      amount: 0,
      previousOutstandingAmount,
      outstandingAmount: previousOutstandingAmount,
      note,
    });

    return savedDebt;
  }

  /**
   * Get debt histories
   */
  async getHistories(id: number, accountId: number) {
    await this.findOne(id, accountId);

    return this.financialDebtHistoryRepository.find({
      where: {
        debtId: id,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  /**
   * Create debt history
   */
  private async createHistory(data: Partial<FinancialDebtHistoryEntity>) {
    const history = this.financialDebtHistoryRepository.create(data);

    return this.financialDebtHistoryRepository.save(history);
  }

  /**
   * Validate debt can be modified
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
