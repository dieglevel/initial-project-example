import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager, In } from "typeorm";

import { FinancialDebtEntity } from "./_entities/financial-debt.entity";
import { FinancialDebtHistoryEntity } from "./_entities/financial-debt-history.entity";
import {
  FINANCIAL_DEBT_DIRECTION_ENUM,
  FINANCIAL_DEBT_STATUS_ENUM,
} from "./financial-debt.enum";
import { FINANCIAL_DEBT_HISTORY_TYPE_ENUM } from "./financial-debt-history.enum";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";

import {
  applyWalletBalanceChange,
  round2,
} from "../financial-wallet/wallet-balance.helper";
import {
  allocateFifo,
  normalizePersonName,
  splitPayment,
} from "./financial-debt.allocation";

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
    // status / mergedIntoId do server quản lý
    const {
      walletId,
      status: _status,
      mergedIntoId: _mergedIntoId,
      ...debtData
    } = data;
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
   * - Nếu có walletId thì biến động số dư ví (không tạo transaction).
   * - Nếu trả hết thì chuyển trạng thái nợ sang PAID_OFF.
   */
  async payment(
    id: number,
    accountId: number,
    dto: DebtActionMeta & { amount: number; walletId?: number | null },
  ) {
    const amount = this.requirePositiveAmount(dto.amount, "Payment amount");
    const occurredAt = this.resolvePastOrToday(dto.occurredAt);

    return this.dataSource.transaction(async (manager) => {
      const debt = await this.lockDebt(manager, id, accountId);
      this.validateActiveDebt(debt);

      if (dto.walletId) {
        await this.applyWalletChange(
          manager,
          dto.walletId,
          accountId,
          this.walletDelta(debt.direction, "PAYMENT", amount),
        );
      }

      return this.applyPayment(manager, debt, amount, {
        occurredAt,
        note: dto.note,
        walletId: dto.walletId ?? null,
      });
    });
  }

  /**
   * Thu / trả nợ theo người: tổng tiền phân bổ vào các khoản đang nợ cùng chiều
   * của người đó, khoản bắt đầu sớm nhất được trả trước (FIFO).
   * Ví chỉ biến động một lần với tổng số tiền; mỗi khoản đều ghi lịch sử riêng.
   */
  async paymentByPerson(
    accountId: number,
    dto: DebtActionMeta & {
      namePerson: string;
      direction: FINANCIAL_DEBT_DIRECTION_ENUM;
      amount: number;
      walletId?: number | null;
    },
  ) {
    const amount = this.requirePositiveAmount(dto.amount, "Payment amount");
    const occurredAt = this.resolvePastOrToday(dto.occurredAt);
    const person = normalizePersonName(dto.namePerson ?? "");
    if (!person) {
      throw new BadRequestException("namePerson is required");
    }

    return this.dataSource.transaction(async (manager) => {
      const candidates = await manager.find(FinancialDebtEntity, {
        where: {
          accountId,
          direction: dto.direction,
          status: FINANCIAL_DEBT_STATUS_ENUM.ACTIVE,
        },
        order: { id: "ASC" },
        lock: { mode: "pessimistic_write" },
      });
      const debts = candidates.filter(
        (d) => normalizePersonName(d.namePerson) === person,
      );
      if (debts.length === 0) {
        throw new NotFoundException("No active debt found for this person");
      }

      if (dto.walletId) {
        await this.applyWalletChange(
          manager,
          dto.walletId,
          accountId,
          this.walletDelta(dto.direction, "PAYMENT", amount),
        );
      }

      const byId = new Map(debts.map((d) => [d.id, d]));
      const saved: FinancialDebtEntity[] = [];
      for (const allocation of allocateFifo(debts, amount)) {
        saved.push(
          await this.applyPayment(
            manager,
            byId.get(allocation.id),
            allocation.amount,
            { occurredAt, note: dto.note, walletId: dto.walletId ?? null },
          ),
        );
      }
      return saved;
    });
  }

  /**
   * Vay / cho vay thêm vào khoản đang có (cộng vào gốc và dư nợ).
   * Khoản đã trả xong được mở lại thành ACTIVE.
   */
  async increase(
    id: number,
    accountId: number,
    dto: DebtActionMeta & { amount: number; walletId?: number | null },
  ) {
    const amount = this.requirePositiveAmount(dto.amount, "Amount");
    const occurredAt = this.resolvePastOrToday(dto.occurredAt);

    return this.dataSource.transaction(async (manager) => {
      const debt = await this.lockDebt(manager, id, accountId);
      if (
        debt.status !== FINANCIAL_DEBT_STATUS_ENUM.ACTIVE &&
        debt.status !== FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF
      ) {
        throw new BadRequestException(
          "Only active or paid off debts can be increased",
        );
      }

      if (dto.walletId) {
        await this.applyWalletChange(
          manager,
          dto.walletId,
          accountId,
          this.walletDelta(debt.direction, "CREATE", amount),
        );
      }

      const previousOutstandingAmount = round2(Number(debt.outstandingAmount));
      debt.originalAmount = round2(Number(debt.originalAmount) + amount);
      debt.outstandingAmount = round2(previousOutstandingAmount + amount);
      debt.status = FINANCIAL_DEBT_STATUS_ENUM.ACTIVE;
      const savedDebt = await manager.save(debt);

      await this.createHistory(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.INCREASED,
        amount,
        previousOutstandingAmount,
        outstandingAmount: savedDebt.outstandingAmount,
        occurredAt,
        walletId: dto.walletId ?? null,
        note: dto.note,
      });

      return savedDebt;
    });
  }

  /**
   * Gộp nhiều khoản đang nợ cùng chiều vào một khoản (không đụng ví).
   * - Khoản đích: cộng gốc + dư nợ của từng khoản nguồn, ngày bắt đầu sớm nhất,
   *   hạn trả sớm nhất.
   * - Khoản nguồn: dư nợ về 0, status MERGED, mergedIntoId = đích; lịch sử giữ nguyên.
   */
  async merge(
    accountId: number,
    dto: { targetId: number; sourceIds: number[]; note?: string },
  ) {
    const sourceIds = [...new Set(dto.sourceIds)];
    if (sourceIds.length === 0) {
      throw new BadRequestException("sourceIds must not be empty");
    }
    if (sourceIds.includes(dto.targetId)) {
      throw new BadRequestException("targetId must not be in sourceIds");
    }
    const occurredAt = todayVN();

    return this.dataSource.transaction(async (manager) => {
      const ids = [dto.targetId, ...sourceIds];
      // Khóa theo thứ tự id để tránh deadlock
      const debts = await manager.find(FinancialDebtEntity, {
        where: { id: In(ids), accountId },
        order: { id: "ASC" },
        lock: { mode: "pessimistic_write" },
      });
      if (debts.length !== ids.length) {
        throw new NotFoundException("Financial debt not found");
      }

      const byId = new Map(debts.map((d) => [d.id, d]));
      const target = byId.get(dto.targetId);
      const sources = sourceIds.map((sid) => byId.get(sid));

      for (const debt of debts) {
        if (debt.status !== FINANCIAL_DEBT_STATUS_ENUM.ACTIVE) {
          throw new BadRequestException(
            `Debt #${debt.id} is not active and cannot be merged`,
          );
        }
        if (debt.direction !== target.direction) {
          throw new BadRequestException(
            "Only debts with the same direction can be merged",
          );
        }
      }

      for (const source of sources) {
        const moved = round2(Number(source.outstandingAmount));
        const targetPrevious = round2(Number(target.outstandingAmount));

        target.originalAmount = round2(
          Number(target.originalAmount) + Number(source.originalAmount),
        );
        target.outstandingAmount = round2(targetPrevious + moved);
        if (source.startDate < target.startDate) {
          target.startDate = source.startDate;
        }
        if (
          source.dueDate &&
          (!target.dueDate || source.dueDate < target.dueDate)
        ) {
          target.dueDate = source.dueDate;
        }

        source.outstandingAmount = 0;
        source.status = FINANCIAL_DEBT_STATUS_ENUM.MERGED;
        source.mergedIntoId = target.id;
        await manager.save(source);

        await this.createHistory(manager, {
          debtId: source.id,
          type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.MERGED_OUT,
          amount: moved,
          previousOutstandingAmount: moved,
          outstandingAmount: 0,
          occurredAt,
          note: dto.note ?? `Gộp vào "${target.name}" (#${target.id})`,
        });
        await this.createHistory(manager, {
          debtId: target.id,
          type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.MERGED_IN,
          amount: moved,
          previousOutstandingAmount: targetPrevious,
          outstandingAmount: target.outstandingAmount,
          occurredAt,
          note: dto.note ?? `Gộp từ "${source.name}" (#${source.id})`,
        });
      }

      return manager.save(target);
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
   * Trừ dư nợ + ghi lịch sử PAYMENT (ví đã được xử lý ở nơi gọi, với toàn bộ số tiền).
   * Phần vượt dư nợ được ghi thêm một dòng INTEREST (tiền lãi); dư nợ không âm.
   */
  private async applyPayment(
    manager: EntityManager,
    debt: FinancialDebtEntity,
    amount: number,
    meta: { occurredAt: string; note?: string; walletId: number | null },
  ) {
    const previousOutstandingAmount = round2(Number(debt.outstandingAmount));
    const { principal, excess } = splitPayment(
      previousOutstandingAmount,
      amount,
    );

    const newOutstandingAmount = round2(previousOutstandingAmount - principal);
    debt.outstandingAmount = newOutstandingAmount;
    if (newOutstandingAmount === 0) {
      debt.status = FINANCIAL_DEBT_STATUS_ENUM.PAID_OFF;
    }
    const savedDebt = await manager.save(debt);

    await this.createHistory(manager, {
      debtId: savedDebt.id,
      type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.PAYMENT,
      amount: principal,
      previousOutstandingAmount,
      outstandingAmount: newOutstandingAmount,
      occurredAt: meta.occurredAt,
      walletId: meta.walletId,
      note: meta.note,
    });

    if (excess > 0) {
      await this.createHistory(manager, {
        debtId: savedDebt.id,
        type: FINANCIAL_DEBT_HISTORY_TYPE_ENUM.INTEREST,
        amount: excess,
        previousOutstandingAmount: newOutstandingAmount,
        outstandingAmount: newOutstandingAmount,
        occurredAt: meta.occurredAt,
        walletId: meta.walletId,
        note: meta.note,
      });
    }

    return savedDebt;
  }

  private requirePositiveAmount(value: number, label: string) {
    const amount = round2(Number(value));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(`${label} must be greater than 0`);
    }
    return amount;
  }

  /** occurredAt mặc định hôm nay; không cho ngày tương lai */
  private resolvePastOrToday(value?: string) {
    const occurredAt = value ?? todayVN();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredAt)) {
      throw new BadRequestException("occurredAt must be in YYYY-MM-DD format");
    }
    if (occurredAt > todayVN()) {
      throw new BadRequestException("occurredAt cannot be in the future");
    }
    return occurredAt;
  }

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

  /** Cập nhật số dư ví (không tạo transaction) — dùng helper chung của module ví */
  private applyWalletChange(
    manager: EntityManager,
    walletId: number,
    accountId: number,
    delta: number,
  ) {
    return applyWalletBalanceChange(manager, walletId, accountId, delta);
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
