import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, Repository } from "typeorm";
import type { SelectQueryBuilder } from "typeorm";

import { BaseCrudService } from "@/common/service/base-crud.service";
import type { PaginationQuery } from "@/common/dto/interface/pagination.interface";
import type { JwtPayload } from "@/module/auth/payload.type";

import { FinancialGoalEntity } from "./_entities/financial-goal.entity";
import { FinancialGoalHistoryEntity } from "./financial-goal-history/_entities/financial-goal-history.entity";
import {
  FINANCIAL_GOAL_SAVING_MODE,
  FINANCIAL_GOAL_STATUS,
} from "./financial-goal.enum";
import {
  FINANCIAL_GOAL_HISTORY_SOURCE,
  FINANCIAL_GOAL_HISTORY_STATUS,
  FINANCIAL_GOAL_HISTORY_TYPE,
} from "./financial-goal-history/financial-goal-history.enum";
import type {
  AddManualContributionDto,
  CancelGoalDto,
  CreateFinancialGoalDto,
  WithdrawFromGoalDto,
} from "./dto/create.dto";
import type {
  CompleteAutoContributionDto,
  UpdateFinancialGoalDto,
} from "./dto/update.dto";
import type {
  FinancialGoal_Projection_Request,
  FinancialGoal_Projection_Response,
} from "./dto/projection.dto";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import {
  applyWalletBalanceChange,
  round2,
} from "../financial-wallet/wallet-balance.helper";

const VN_TZ = "Asia/Ho_Chi_Minh";

/** "YYYY-MM-DD" theo giờ Việt Nam (không phụ thuộc múi giờ server) */
export const todayVN = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: VN_TZ }).format(date);

/** "YYYY-MM" theo giờ Việt Nam */
const currentPeriodVN = () => todayVN().slice(0, 7);

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Các field được phép sửa qua update (status / currentAmount không nằm ở đây) */
const UPDATABLE_FIELDS = [
  "name",
  "description",
  "type",
  "targetAmount",
  "deadline",
  "imageUrl",
  "isLocked",
  "savingMode",
  "autoContributionAmount",
  "autoContributionDay",
  "walletId",
] as const;

export interface FinancialGoalPagingResult {
  items: (FinancialGoalEntity & { progressPercentage: number })[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface AutoContributionRunResult {
  /** Đã trừ ví và cộng vào mục tiêu */
  completed: number;
  /** Tạo khoản chờ xác nhận (không có ví / ví không đủ tiền) */
  pending: number;
  /** Đã có khoản góp tự động của kỳ này, bỏ qua */
  skipped: number;
  failed: number;
}

@Injectable()
export class FinancialGoalService extends BaseCrudService<FinancialGoalEntity> {
  private readonly logger = new Logger(FinancialGoalService.name);

  constructor(
    @InjectRepository(FinancialGoalEntity)
    private readonly goalRepository: Repository<FinancialGoalEntity>,

    @InjectRepository(FinancialGoalHistoryEntity)
    private readonly historyRepository: Repository<FinancialGoalHistoryEntity>,

    @InjectRepository(FinancialWalletEntity)
    private readonly walletRepository: Repository<FinancialWalletEntity>,

    private readonly dataSource: DataSource,
  ) {
    super(goalRepository);
  }

  // ───────────────────────── helpers ─────────────────────────

  private calculateProgress(currentAmount: number, targetAmount: number) {
    if (targetAmount <= 0) return 0;
    return Math.min(
      Number(((currentAmount / targetAmount) * 100).toFixed(2)),
      100,
    );
  }

  private enrichGoal(goal: FinancialGoalEntity) {
    return {
      ...goal,
      progressPercentage: this.calculateProgress(
        Number(goal.currentAmount),
        Number(goal.targetAmount),
      ),
    };
  }

  private remainingOf(goal: FinancialGoalEntity) {
    return Math.max(
      0,
      round2(Number(goal.targetAmount) - Number(goal.currentAmount)),
    );
  }

  private async findUserGoal(
    goalId: number,
    userId: number,
  ): Promise<FinancialGoalEntity> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId: userId },
    });
    if (!goal) {
      throw new NotFoundException(`Financial Goal #${goalId} not found`);
    }
    return goal;
  }

  /** Khóa dòng mục tiêu trong transaction (đọc lại số mới nhất) */
  private async lockGoal(
    manager: EntityManager,
    goalId: number,
    userId: number,
  ): Promise<FinancialGoalEntity> {
    const goal = await manager.findOne(FinancialGoalEntity, {
      where: { id: goalId, accountId: userId },
      lock: { mode: "pessimistic_write" },
    });
    if (!goal) {
      throw new NotFoundException(`Financial Goal #${goalId} not found`);
    }
    return goal;
  }

  private async lockUserHistory(
    manager: EntityManager,
    historyId: number,
    userId: number,
  ): Promise<{
    history: FinancialGoalHistoryEntity;
    goal: FinancialGoalEntity;
  }> {
    const history = await manager.findOne(FinancialGoalHistoryEntity, {
      where: { id: historyId },
      lock: { mode: "pessimistic_write" },
    });
    // Không lộ việc history thuộc người khác → luôn 404
    const goal: FinancialGoalEntity | null = history
      ? await manager.findOne(FinancialGoalEntity, {
          where: { id: history.goalId, accountId: userId },
          lock: { mode: "pessimistic_write" },
        })
      : null;
    if (!history || !goal) {
      throw new NotFoundException(`History #${historyId} not found`);
    }
    return { history, goal };
  }

  private async assertWalletOwned(walletId: number, userId: number) {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, account: { id: userId } },
    });
    if (!wallet) {
      throw new NotFoundException("Financial wallet not found");
    }
  }

  /** AUTO cần đủ số tiền + ngày; MANUAL thì xóa cấu hình tự động */
  private normalizeSavingMode(goal: {
    savingMode?: FINANCIAL_GOAL_SAVING_MODE;
    autoContributionAmount?: number | null;
    autoContributionDay?: number | null;
  }) {
    if (goal.savingMode === FINANCIAL_GOAL_SAVING_MODE.AUTO) {
      if (!goal.autoContributionAmount || !goal.autoContributionDay) {
        throw new BadRequestException(
          "AUTO saving mode requires autoContributionAmount and autoContributionDay",
        );
      }
    } else {
      goal.autoContributionAmount = null;
      goal.autoContributionDay = null;
    }
  }

  /**
   * Đồng bộ trạng thái hoàn thành theo số tiền:
   * ACTIVE đủ tiền → COMPLETED; COMPLETED thiếu tiền (rút / tăng mục tiêu) → ACTIVE.
   * INACTIVE / CANCELLED giữ nguyên.
   */
  private syncCompletion(goal: FinancialGoalEntity) {
    const reached = Number(goal.currentAmount) >= Number(goal.targetAmount);
    if (goal.status === FINANCIAL_GOAL_STATUS.ACTIVE && reached) {
      goal.status = FINANCIAL_GOAL_STATUS.COMPLETED;
    } else if (goal.status === FINANCIAL_GOAL_STATUS.COMPLETED && !reached) {
      goal.status = FINANCIAL_GOAL_STATUS.ACTIVE;
    }
  }

  /** Góp không được vượt số còn thiếu (tránh "mất" phần dư) */
  private assertWithinRemaining(goal: FinancialGoalEntity, amount: number) {
    const remaining = this.remainingOf(goal);
    if (round2(amount) > remaining) {
      throw new BadRequestException(
        `Contribution exceeds remaining amount (${remaining})`,
      );
    }
  }

  private assertActive(goal: FinancialGoalEntity) {
    if (goal.status !== FINANCIAL_GOAL_STATUS.ACTIVE) {
      throw new BadRequestException("Goal is not active");
    }
  }

  /** Cộng tiền vào mục tiêu + ghi lịch sử (trong transaction, goal đã khóa) */
  private async applyContribution(
    manager: EntityManager,
    goal: FinancialGoalEntity,
    amount: number,
    walletId: number | null | undefined,
  ) {
    if (walletId) {
      await applyWalletBalanceChange(
        manager,
        walletId,
        goal.accountId,
        -amount,
      );
    }
    goal.currentAmount = round2(Number(goal.currentAmount) + amount);
    this.syncCompletion(goal);
    await manager.save(goal);
  }

  // ───────────────────────── CRUD (owner-scoped) ─────────────────────────

  override async create(
    data: CreateFinancialGoalDto & { account?: { id: number } },
    relations?: Record<string, number>,
  ): Promise<FinancialGoalEntity> {
    const accountId = data.account?.id;
    if (!accountId) {
      throw new BadRequestException("Account is required");
    }
    this.normalizeSavingMode(data);
    if (data.walletId) {
      await this.assertWalletOwned(data.walletId, accountId);
    }

    return super.create(
      {
        ...data,
        // Mục tiêu mới luôn bắt đầu ACTIVE, số đã tích lũy = 0
        status: FINANCIAL_GOAL_STATUS.ACTIVE,
        currentAmount: 0,
        isLocked: data.isLocked ?? false,
        walletId: data.walletId ?? null,
      } as never,
      relations,
    );
  }

  /** Chỉ trả mục tiêu của user hiện tại */
  async pagingForUser(
    pagination: PaginationQuery<FinancialGoalEntity>,
    userId: number,
  ): Promise<FinancialGoalPagingResult> {
    const result = await super.paging(pagination, {
      relations: (qb: SelectQueryBuilder<FinancialGoalEntity>) => {
        qb.andWhere(`${qb.alias}.accountId = :accountId`, {
          accountId: userId,
        });
      },
    });
    return {
      ...result,
      items: result.items.map((goal) => this.enrichGoal(goal)),
    };
  }

  /**
   * Sửa thông tin mục tiêu. Không đổi được status / currentAmount.
   * Đổi targetAmount sẽ tự cập nhật COMPLETED ↔ ACTIVE.
   */
  async updateForUser(
    goalId: number,
    userId: number,
    dto: UpdateFinancialGoalDto,
  ): Promise<FinancialGoalEntity> {
    const goal = await this.findUserGoal(goalId, userId);

    // Chỉ lấy field cho phép (ValidationPipe không bật whitelist)
    const patch = Object.fromEntries(
      UPDATABLE_FIELDS.filter((k) => dto[k] !== undefined).map((k) => [
        k,
        dto[k],
      ]),
    ) as Partial<FinancialGoalEntity>;

    if (patch.walletId) {
      await this.assertWalletOwned(patch.walletId, userId);
    }

    Object.assign(goal, patch);
    this.normalizeSavingMode(goal);
    this.syncCompletion(goal);
    return this.goalRepository.save(goal);
  }

  async deleteForUser(goalId: number, userId: number): Promise<boolean> {
    const goal = await this.findUserGoal(goalId, userId);
    await this.goalRepository.softDelete(goal.id);
    return true;
  }

  // ───────────────────────── read ─────────────────────────

  async getDetail(goalId: number, userId: number) {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId, accountId: userId },
      relations: { histories: { wallet: true }, wallet: true },
      order: { histories: { createdAt: "DESC" } },
    });
    if (!goal) {
      throw new NotFoundException(`Financial Goal #${goalId} not found`);
    }
    const { histories, ...rest } = goal;
    return {
      goal: this.enrichGoal(rest as FinancialGoalEntity),
      histories: histories ?? [],
    };
  }

  async getProjection(
    goalId: number,
    query: FinancialGoal_Projection_Request,
    user: JwtPayload,
  ): Promise<FinancialGoal_Projection_Response> {
    const goal = await this.findUserGoal(goalId, user.sub);
    const remainingAmount = this.remainingOf(goal);

    const assumed = Number(query.monthlySavingRate ?? 0);
    const monthlyAmount =
      assumed > 0
        ? assumed
        : goal.savingMode === FINANCIAL_GOAL_SAVING_MODE.AUTO
          ? Number(goal.autoContributionAmount ?? 0)
          : 0;

    const estimatedMonthsToTarget =
      remainingAmount === 0
        ? 0
        : monthlyAmount > 0
          ? Math.ceil(remainingAmount / monthlyAmount)
          : null;

    const addMonths = (months: number) => {
      const d = new Date(`${todayVN()}T00:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + months);
      return d.toISOString().slice(0, 10);
    };

    // Số tháng còn lại tới deadline (tối thiểu 1 nếu deadline chưa qua)
    let monthsUntilDeadline: number | null = null;
    if (goal.deadline) {
      const today = new Date(`${todayVN()}T00:00:00Z`);
      const deadline = new Date(goal.deadline);
      const days = (deadline.getTime() - today.getTime()) / 86_400_000;
      monthsUntilDeadline =
        days <= 0 ? 0 : Math.max(1, Math.ceil(days / 30.44));
    }

    const requiredMonthlyAmount =
      monthsUntilDeadline === null
        ? null
        : monthsUntilDeadline === 0
          ? remainingAmount
          : round2(remainingAmount / monthsUntilDeadline);

    return {
      goalId: goal.id,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      remainingAmount,
      progressPercentage: this.calculateProgress(
        Number(goal.currentAmount),
        Number(goal.targetAmount),
      ),
      monthlyAmount,
      estimatedMonthsToTarget,
      estimatedCompletionDate:
        estimatedMonthsToTarget === null
          ? null
          : addMonths(estimatedMonthsToTarget),
      monthsUntilDeadline,
      requiredMonthlyAmount,
      onTrack:
        requiredMonthlyAmount === null
          ? null
          : remainingAmount === 0 || monthlyAmount >= requiredMonthlyAmount,
    };
  }

  // ───────────────────────── money flows ─────────────────────────

  /** Góp tay. walletId có → trừ ví; không → chỉ ghi sổ */
  async addManualContribution(
    goalId: number,
    userId: number,
    dto: AddManualContributionDto,
  ) {
    const amount = round2(Number(dto.amount));
    return this.dataSource.transaction(async (manager) => {
      const goal = await this.lockGoal(manager, goalId, userId);
      this.assertActive(goal);
      this.assertWithinRemaining(goal, amount);

      const history = manager.create(FinancialGoalHistoryEntity, {
        goalId: goal.id,
        period: dto.period ?? currentPeriodVN(),
        type: FINANCIAL_GOAL_HISTORY_TYPE.CONTRIBUTION,
        plannedAmount: amount,
        amount,
        source: FINANCIAL_GOAL_HISTORY_SOURCE.USER,
        status: FINANCIAL_GOAL_HISTORY_STATUS.COMPLETED,
        walletId: dto.walletId ?? null,
        note: dto.note,
        completedAt: new Date(),
      });

      await this.applyContribution(manager, goal, amount, dto.walletId);
      await manager.save(history);

      return {
        history,
        currentAmount: goal.currentAmount,
        isCompleted: goal.status === FINANCIAL_GOAL_STATUS.COMPLETED,
      };
    });
  }

  /** Xác nhận khoản góp tự động đang chờ (có thể sửa số tiền / chọn ví) */
  async completePendingHistory(
    historyId: number,
    userId: number,
    dto: CompleteAutoContributionDto,
  ) {
    const amount = round2(Number(dto.amount));
    return this.dataSource.transaction(async (manager) => {
      const { history, goal } = await this.lockUserHistory(
        manager,
        historyId,
        userId,
      );
      if (history.status !== FINANCIAL_GOAL_HISTORY_STATUS.PENDING) {
        throw new BadRequestException("History is not pending");
      }
      this.assertActive(goal);
      this.assertWithinRemaining(goal, amount);

      await this.applyContribution(manager, goal, amount, dto.walletId);

      history.amount = amount;
      history.status = FINANCIAL_GOAL_HISTORY_STATUS.COMPLETED;
      history.walletId = dto.walletId ?? null;
      history.note = dto.note ?? history.note;
      history.completedAt = new Date();
      await manager.save(history);

      return {
        history,
        currentAmount: goal.currentAmount,
        status: goal.status,
      };
    });
  }

  async skipHistory(historyId: number, userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const { history } = await this.lockUserHistory(
        manager,
        historyId,
        userId,
      );
      if (history.status !== FINANCIAL_GOAL_HISTORY_STATUS.PENDING) {
        throw new BadRequestException("Only pending history can be skipped");
      }
      history.status = FINANCIAL_GOAL_HISTORY_STATUS.SKIPPED;
      history.amount = 0;
      return manager.save(history);
    });
  }

  /**
   * Rút tiền khỏi mục tiêu. Bị chặn khi isLocked hoặc đã hủy.
   * walletId có → cộng vào ví; không → chỉ ghi sổ.
   */
  async withdraw(goalId: number, userId: number, dto: WithdrawFromGoalDto) {
    const amount = round2(Number(dto.amount));
    return this.dataSource.transaction(async (manager) => {
      const goal = await this.lockGoal(manager, goalId, userId);
      if (goal.status === FINANCIAL_GOAL_STATUS.CANCELLED) {
        throw new BadRequestException("Goal is cancelled");
      }
      if (goal.isLocked) {
        throw new BadRequestException(
          "Goal is locked for withdrawals. Unlock it first",
        );
      }
      if (amount > Number(goal.currentAmount)) {
        throw new BadRequestException(
          `Withdrawal exceeds saved amount (${Number(goal.currentAmount)})`,
        );
      }

      const history = await this.recordWithdrawal(
        manager,
        goal,
        amount,
        dto.walletId,
        dto.note,
      );
      return {
        history,
        currentAmount: goal.currentAmount,
        status: goal.status,
      };
    });
  }

  private async recordWithdrawal(
    manager: EntityManager,
    goal: FinancialGoalEntity,
    amount: number,
    walletId: number | undefined,
    note: string | undefined,
  ) {
    if (walletId) {
      await applyWalletBalanceChange(manager, walletId, goal.accountId, amount);
    }
    goal.currentAmount = round2(Number(goal.currentAmount) - amount);
    this.syncCompletion(goal);
    await manager.save(goal);

    const history = manager.create(FinancialGoalHistoryEntity, {
      goalId: goal.id,
      period: currentPeriodVN(),
      type: FINANCIAL_GOAL_HISTORY_TYPE.WITHDRAWAL,
      plannedAmount: amount,
      amount,
      source: FINANCIAL_GOAL_HISTORY_SOURCE.USER,
      status: FINANCIAL_GOAL_HISTORY_STATUS.COMPLETED,
      walletId: walletId ?? null,
      note,
      completedAt: new Date(),
    });
    return manager.save(history);
  }

  // ───────────────────────── lifecycle ─────────────────────────

  /**
   * Hủy mục tiêu (ACTIVE / INACTIVE → CANCELLED). Các khoản chờ bị bỏ qua.
   * refundWalletId có → hoàn toàn bộ số đã tích lũy vào ví (bị chặn khi isLocked).
   */
  async cancelGoal(goalId: number, userId: number, dto: CancelGoalDto = {}) {
    return this.dataSource.transaction(async (manager) => {
      const goal = await this.lockGoal(manager, goalId, userId);
      if (
        goal.status !== FINANCIAL_GOAL_STATUS.ACTIVE &&
        goal.status !== FINANCIAL_GOAL_STATUS.INACTIVE
      ) {
        throw new BadRequestException(
          "Only active or paused goal can be cancelled",
        );
      }

      const saved = Number(goal.currentAmount);
      if (dto.refundWalletId && saved > 0) {
        if (goal.isLocked) {
          throw new BadRequestException(
            "Goal is locked for withdrawals. Unlock it first",
          );
        }
        await this.recordWithdrawal(
          manager,
          goal,
          saved,
          dto.refundWalletId,
          "Hoàn tiền khi hủy mục tiêu",
        );
      }

      await manager.update(
        FinancialGoalHistoryEntity,
        { goalId: goal.id, status: FINANCIAL_GOAL_HISTORY_STATUS.PENDING },
        { status: FINANCIAL_GOAL_HISTORY_STATUS.SKIPPED, amount: 0 },
      );

      goal.status = FINANCIAL_GOAL_STATUS.CANCELLED;
      return manager.save(goal);
    });
  }

  /** Tạm dừng: ACTIVE → INACTIVE (cron bỏ qua, không góp được) */
  async pauseGoal(goalId: number, userId: number) {
    const goal = await this.findUserGoal(goalId, userId);
    if (goal.status !== FINANCIAL_GOAL_STATUS.ACTIVE) {
      throw new BadRequestException("Only active goal can be paused");
    }
    goal.status = FINANCIAL_GOAL_STATUS.INACTIVE;
    return this.goalRepository.save(goal);
  }

  /** Tiếp tục: INACTIVE → ACTIVE (hoặc COMPLETED nếu đã đủ tiền) */
  async resumeGoal(goalId: number, userId: number) {
    const goal = await this.findUserGoal(goalId, userId);
    if (goal.status !== FINANCIAL_GOAL_STATUS.INACTIVE) {
      throw new BadRequestException("Only paused goal can be resumed");
    }
    goal.status = FINANCIAL_GOAL_STATUS.ACTIVE;
    this.syncCompletion(goal);
    return this.goalRepository.save(goal);
  }

  // ───────────────────────── auto contribution (cron) ─────────────────────────

  /**
   * Góp tự động cho kỳ hiện tại. Chạy hằng ngày; idempotent theo (goalId, period):
   * - Chỉ mục tiêu ACTIVE + AUTO, khi hôm nay ≥ ngày góp của tháng
   *   (ngày 31 ở tháng 30 ngày → ngày 30), và ngày góp không trước ngày tạo mục tiêu.
   * - Số góp = min(autoContributionAmount, số còn thiếu).
   * - Có ví mặc định và đủ tiền → trừ ví, COMPLETED.
   *   Không có ví / ví không đủ → tạo khoản PENDING để người dùng xác nhận hoặc bỏ qua.
   */
  async runAutoContributions(
    today: string = todayVN(),
  ): Promise<AutoContributionRunResult> {
    const result: AutoContributionRunResult = {
      completed: 0,
      pending: 0,
      skipped: 0,
      failed: 0,
    };
    const [year, month, day] = today.split("-").map(Number);
    const period = today.slice(0, 7);
    const lastDay = daysInMonth(year, month);

    const goals = await this.goalRepository.find({
      where: {
        status: FINANCIAL_GOAL_STATUS.ACTIVE,
        savingMode: FINANCIAL_GOAL_SAVING_MODE.AUTO,
      },
    });

    const dueGoals = goals.filter((g) => {
      if (!g.autoContributionAmount || !g.autoContributionDay) return false;
      const dueDay = Math.min(g.autoContributionDay, lastDay);
      const dueDate = `${period}-${String(dueDay).padStart(2, "0")}`;
      return day >= dueDay && dueDate >= todayVN(new Date(g.createdAt));
    });
    if (dueGoals.length === 0) return result;

    const done = await this.historyRepository.find({
      select: { goalId: true },
      where: {
        goalId: In(dueGoals.map((g) => g.id)),
        period,
        source: FINANCIAL_GOAL_HISTORY_SOURCE.SYSTEM,
      },
    });
    const doneIds = new Set(done.map((h) => h.goalId));

    for (const candidate of dueGoals) {
      if (doneIds.has(candidate.id)) {
        result.skipped++;
        continue;
      }
      try {
        const outcome = await this.dataSource.transaction((manager) =>
          this.autoContributeOne(manager, candidate.id, period),
        );
        result[outcome]++;
      } catch (error) {
        result.failed++;
        this.logger.error(
          `Auto contribution failed for goal #${candidate.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
    return result;
  }

  private async autoContributeOne(
    manager: EntityManager,
    goalId: number,
    period: string,
  ): Promise<keyof AutoContributionRunResult> {
    const goal = await manager.findOne(FinancialGoalEntity, {
      where: { id: goalId },
      lock: { mode: "pessimistic_write" },
    });
    // Có thể đã đổi trạng thái giữa lúc đọc danh sách và lúc khóa
    if (
      !goal ||
      goal.status !== FINANCIAL_GOAL_STATUS.ACTIVE ||
      goal.savingMode !== FINANCIAL_GOAL_SAVING_MODE.AUTO
    ) {
      return "skipped";
    }
    const exists = await manager.exists(FinancialGoalHistoryEntity, {
      where: { goalId, period, source: FINANCIAL_GOAL_HISTORY_SOURCE.SYSTEM },
    });
    if (exists) return "skipped";

    const planned = Math.min(
      Number(goal.autoContributionAmount ?? 0),
      this.remainingOf(goal),
    );
    if (planned <= 0) return "skipped";

    let walletOk = false;
    if (goal.walletId) {
      const wallet = await manager.findOne(FinancialWalletEntity, {
        where: { id: goal.walletId, account: { id: goal.accountId } },
      });
      walletOk = !!wallet && Number(wallet.balance) >= planned;
    }

    const base = {
      goalId,
      period,
      type: FINANCIAL_GOAL_HISTORY_TYPE.CONTRIBUTION,
      plannedAmount: planned,
      source: FINANCIAL_GOAL_HISTORY_SOURCE.SYSTEM,
      walletId: goal.walletId ?? null,
    };

    if (walletOk && goal.walletId) {
      await this.applyContribution(manager, goal, planned, goal.walletId);
      await manager.save(
        manager.create(FinancialGoalHistoryEntity, {
          ...base,
          amount: planned,
          status: FINANCIAL_GOAL_HISTORY_STATUS.COMPLETED,
          note: "Góp tự động",
          completedAt: new Date(),
        }),
      );
      return "completed";
    }

    await manager.save(
      manager.create(FinancialGoalHistoryEntity, {
        ...base,
        amount: 0,
        status: FINANCIAL_GOAL_HISTORY_STATUS.PENDING,
        note: goal.walletId
          ? "Ví không đủ số dư — chờ xác nhận"
          : "Góp tự động — chờ xác nhận",
      }),
    );
    return "pending";
  }

  // ───────────────────────── summary ─────────────────────────

  async walletBalanceApplyGoal(user: JwtPayload) {
    const walletBalanceResult: { totalAmount: string }[] =
      await this.dataSource.query(
        `
      SELECT COALESCE(SUM(balance), 0) as "totalAmount"
      FROM "financial-wallet"
      WHERE "accountId" = $1 AND "deletedAt" IS NULL
      `,
        [user.sub],
      );
    const walletBalance = Number(walletBalanceResult[0].totalAmount);

    const goals = await this.goalRepository.find({
      where: { accountId: user.sub },
    });

    const summarize = (items: FinancialGoalEntity[]) => {
      const totalCurrentAmount = items.reduce(
        (sum, g) => sum + Number(g.currentAmount ?? 0),
        0,
      );
      const totalTargetAmount = items.reduce(
        (sum, g) => sum + Number(g.targetAmount ?? 0),
        0,
      );
      return {
        totalCurrentAmount,
        totalTargetAmount,
        percentage:
          totalTargetAmount > 0
            ? Number(
                ((totalCurrentAmount / totalTargetAmount) * 100).toFixed(2),
              )
            : 0,
      };
    };

    const active = summarize(
      goals.filter((g) => g.status === FINANCIAL_GOAL_STATUS.ACTIVE),
    );
    const inActive = summarize(
      goals.filter((g) => g.status !== FINANCIAL_GOAL_STATUS.ACTIVE),
    );

    return {
      walletBalance,
      totalActiveGoalAmount: active.totalCurrentAmount,
      active,
      inActive,
    };
  }
}
