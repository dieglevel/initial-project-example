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

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** "YYYY-MM-DD" theo giờ Việt Nam (không phụ thuộc múi giờ server) */
const todayVN = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );

interface DebtActionMeta {
  occurredAt?: string;
  note?: string;
}

@Injectable()
export class FinancialDebtService extends BaseCrudService<FinancialDebtEntity> {
  constructor(
    @InjectRepository(FinancialDebtEntity)
    private readonly financialDebtRepository: Repository<FinancialDebtEntity>,

    @InjectRepository(FinancialDebtHistoryEntity)
    private readonly financialDebtHistoryRepository: Repository<FinancialDebtHistoryEntity>,

    private readonly dataSource: DataSource,
  ) {
    super(financialDebtRepository);
  }

  /**
   * Tạo khoản nợ. Nếu có walletId thì biến động số dư ví (không tạo transaction).
   */
  async create(
    data: Partial<FinancialDebtEntity> & { walletId?: number | null },
  ) {
    const { walletId, ...debtData } = data;
    const { account, direction } = debtData;
    const originalAmount = round2(Number(debtData.originalAmount));
    const accountId = account?.id;

    if (!originalAmount || originalAmount <= 0) {
      throw new BadRequestException("Original amount must be greater than 0");
    }
    if (!accountId || !direction) {
      throw new BadRequestException("accountId and direction are required");
    }

    return this.dataSource.transaction(async (manager) => {
      if (walletId) {
        await this.applyWalletChange(
          manager,
          walletId,
          accountId,
          this.walletDelta(direction, "CREATE", originalAmount),
        );
      }

      const debt = manager.create(FinancialDebtEntity, {
        ...debtData,
        originalAmount,
        outstandingAmount: originalAmount,
        status: FINANCIAL_DEBT_STATUS_ENUM.ACTIVE,
      });
      const savedDebt = await manager.save(debt);

      await this.createHistory(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.CREATED,
        amount: originalAmount,
        previousOutstandingAmount: 0,
        outstandingAmount: originalAmount,
        occurredAt: debtData.startDate ?? todayVN(),
        walletId: walletId ?? null,
      });

      return savedDebt;
    });
  }

  /**
   * Thanh toán nợ (một phần hoặc toàn phần)
   */
  async payment(
    id: number,
    accountId: number,
    dto: DebtActionMeta & { amount: number; walletId?: number | null },
  ) {
    const amount = round2(Number(dto.amount));
    if (!(amount > 0)) {
      throw new BadRequestException("Payment amount must be greater than 0");
    }

    return this.dataSource.transaction(async (manager) => {
      const debt = await this.lockDebt(manager, id, accountId);
      this.validateActiveDebt(debt);

      if (amount > debt.outstandingAmount) {
        throw new BadRequestException(
          "Payment amount cannot exceed outstanding amount",
        );
      }

      if (dto.walletId) {
        await this.applyWalletChange(
          manager,
          dto.walletId,
          accountId,
          this.walletDelta(debt.direction, "PAYMENT", amount),
        );
      }

      const previousOutstandingAmount = debt.outstandingAmount;
      debt.outstandingAmount = round2(previousOutstandingAmount - amount);
      if (debt.outstandingAmount === 0) {
        debt.status = FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF;
      }
      const savedDebt = await manager.save(debt);

      await this.createHistory(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.PAYMENT,
        amount,
        previousOutstandingAmount,
        outstandingAmount: savedDebt.outstandingAmount,
        occurredAt: dto.occurredAt ?? todayVN(),
        walletId: dto.walletId ?? null,
        note: dto.note,
      });

      return savedDebt;
    });
  }

  /**
   * Điều chỉnh số dư nợ thủ công (không đụng ví)
   */
  async adjust(
    id: number,
    accountId: number,
    dto: DebtActionMeta & { outstandingAmount: number },
  ) {
    const outstandingAmount = round2(Number(dto.outstandingAmount));
    if (!(outstandingAmount >= 0)) {
      throw new BadRequestException("Outstanding amount cannot be negative");
    }

    return this.dataSource.transaction(async (manager) => {
      const debt = await this.lockDebt(manager, id, accountId);
      this.validateActiveDebt(debt);

      const previousOutstandingAmount = debt.outstandingAmount;
      debt.outstandingAmount = outstandingAmount;
      debt.status =
        outstandingAmount === 0
          ? FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF
          : FINANCIAL_DEBT_STATUS_ENUM.ACTIVE;

      const savedDebt = await manager.save(debt);

      await this.createHistory(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.ADJUSTMENT,
        amount: round2(Math.abs(outstandingAmount - previousOutstandingAmount)),
        previousOutstandingAmount,
        outstandingAmount,
        occurredAt: dto.occurredAt ?? todayVN(),
        note: dto.note,
      });

      return savedDebt;
    });
  }

  /**
   * Tất toán / miễn nợ (không đụng ví)
   */
  async settle(id: number, accountId: number, dto: DebtActionMeta = {}) {
    return this.dataSource.transaction(async (manager) => {
      const debt = await this.lockDebt(manager, id, accountId);
      this.validateActiveDebt(debt);

      const previousOutstandingAmount = debt.outstandingAmount;
      debt.outstandingAmount = 0;
      debt.status = FINANCIAL_DEBT_STATUS_ENUM.SETTLED;
      const savedDebt = await manager.save(debt);

      await this.createHistory(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.SETTLED,
        amount: previousOutstandingAmount,
        previousOutstandingAmount,
        outstandingAmount: 0,
        occurredAt: dto.occurredAt ?? todayVN(),
        note: dto.note,
      });

      return savedDebt;
    });
  }

  /**
   * Hủy khoản nợ (không đụng ví)
   */
  async cancel(id: number, accountId: number, dto: DebtActionMeta = {}) {
    return this.dataSource.transaction(async (manager) => {
      const debt = await this.lockDebt(manager, id, accountId);

      if (debt.status === FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF) {
        throw new BadRequestException("Paid off debt cannot be cancelled");
      }
      if (debt.status === FINANCIAL_DEBT_STATUS_ENUM.CANCELLED) {
        throw new BadRequestException("Debt is already cancelled");
      }

      debt.status = FINANCIAL_DEBT_STATUS_ENUM.CANCELLED;
      const savedDebt = await manager.save(debt);

      await this.createHistory(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.CANCELLED,
        amount: 0,
        previousOutstandingAmount: savedDebt.outstandingAmount,
        outstandingAmount: savedDebt.outstandingAmount,
        occurredAt: dto.occurredAt ?? todayVN(),
        note: dto.note,
      });

      return savedDebt;
    });
  }

  /**
   * Lịch sử nợ: mới nhất trước
   */
  async getHistories(id: number, accountId: number) {
    await this.findOne(id, accountId);

    return this.financialDebtHistoryRepository.find({
      where: { debtId: id },
      relations: { wallet: true },
      order: { occurredAt: "DESC", id: "DESC" },
    });
  }

  /**
   * Sửa số tiền gốc nhập nhầm.
   * - Giữ nguyên số đã thu/trả, dư nợ mới = gốc mới - đã trả
   * - Bù chênh lệch vào đúng ví đã dùng lúc tạo (nếu có)
   */
  async correctAmount(
    id: number,
    accountId: number,
    dto: DebtActionMeta & { originalAmount: number },
  ) {
    const newOriginal = round2(Number(dto.originalAmount));
    if (!(newOriginal > 0)) {
      throw new BadRequestException("Original amount must be greater than 0");
    }

    return this.dataSource.transaction(async (manager) => {
      const debt = await this.lockDebt(manager, id, accountId);
      this.validateActiveDebt(debt);

      const oldOriginal = Number(debt.originalAmount);
      const diff = round2(newOriginal - oldOriginal);
      if (diff === 0) {
        throw new BadRequestException("Số tiền không thay đổi");
      }

      const paid = round2(oldOriginal - Number(debt.outstandingAmount));
      const newOutstanding = round2(newOriginal - paid);
      if (newOutstanding < 0) {
        throw new BadRequestException(
          `Số tiền gốc mới không được nhỏ hơn số đã thu/trả (${paid})`,
        );
      }

      // Ví đã dùng lúc tạo nợ
      const created = await manager.findOne(FinancialDebtHistoryEntity, {
        where: { debtId: id, type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.CREATED },
      });
      if (created?.walletId) {
        // diff âm → walletDelta tự đảo dấu, hoàn tiền lại đúng chiều
        await this.applyWalletChange(
          manager,
          created.walletId,
          accountId,
          this.walletDelta(debt.direction, "CREATE", diff),
        );
      }

      const previousOutstandingAmount = Number(debt.outstandingAmount);
      debt.originalAmount = newOriginal;
      debt.outstandingAmount = newOutstanding;
      if (newOutstanding === 0)
        debt.status = FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF;
      const savedDebt = await manager.save(debt);

      await this.createHistory(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.CORRECTED,
        amount: round2(Math.abs(diff)),
        previousOutstandingAmount,
        outstandingAmount: newOutstanding,
        occurredAt: dto.occurredAt ?? todayVN(),
        walletId: created?.walletId ?? null,
        note: dto.note ?? `Sửa số tiền gốc: ${oldOriginal} → ${newOriginal}`,
      });

      return savedDebt;
    });
  }

  // ───────────────────────── helpers ─────────────────────────

  /**
   * Chiều tiền của VÍ:
   * - OUTGOING (mình nợ):      tạo nợ → tiền vào ví,  trả nợ → tiền ra ví
   * - INCOMING (người khác nợ): tạo nợ → tiền ra ví,  thu nợ → tiền vào ví
   */
  private walletDelta(
    direction: FINANCIAL_DEBT_DIRECTION_ENUM,
    kind: "CREATE" | "PAYMENT",
    amount: number,
  ): number {
    const moneyIn =
      (direction === FINANCIAL_DEBT_DIRECTION_ENUM.OUTGOING) ===
      (kind === "CREATE");
    return moneyIn ? amount : -amount;
  }

  /**
   * Kiểm tra ví thuộc account, khóa dòng, cập nhật số dư. Không tạo transaction.
   */
  private async applyWalletChange(
    manager: EntityManager,
    walletId: number,
    accountId: number,
    delta: number,
  ) {
    // Kiểm tra quyền sở hữu (query có join relation nên không khóa ở đây)
    const owned = await manager.findOne(FinancialWalletEntity, {
      where: { id: walletId, account: { id: accountId } },
    });
    if (!owned) {
      throw new NotFoundException("Financial wallet not found");
    }

    // Đọc lại số dư mới nhất dưới khóa
    const wallet = await manager.findOneOrFail(FinancialWalletEntity, {
      where: { id: walletId },
      lock: { mode: "pessimistic_write" },
    });

    const newBalance = round2(Number(wallet.balance) + delta);
    if (newBalance < 0) {
      throw new BadRequestException("Insufficient wallet balance");
    }

    wallet.balance = newBalance;
    return manager.save(wallet);
  }

  private async lockDebt(
    manager: EntityManager,
    id: number,
    accountId: number,
  ) {
    const debt = await manager.findOne(FinancialDebtEntity, {
      where: { id, accountId },
      lock: { mode: "pessimistic_write" },
    });
    if (!debt) {
      throw new NotFoundException("Financial debt not found");
    }
    return debt;
  }

  private createHistory(
    manager: EntityManager,
    data: Partial<FinancialDebtHistoryEntity>,
  ) {
    return manager.save(manager.create(FinancialDebtHistoryEntity, data));
  }

  private validateActiveDebt(debt: FinancialDebtEntity) {
    if (debt.status !== FINANCIAL_DEBT_STATUS_ENUM.ACTIVE) {
      throw new BadRequestException("Debt is not active");
    }
    if (debt.outstandingAmount <= 0) {
      throw new BadRequestException("Debt has no outstanding amount");
    }
  }
}
