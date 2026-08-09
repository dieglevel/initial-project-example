import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, MoreThan, Repository } from "typeorm";

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
  CreateFinancialGoalDto,
  type AddManualContributionDto,
} from "./dto/create.dto";

import type { FinancialGoal_Projection_Request } from "./dto/projection.dto";
import {
  FINANCIAL_GOAL_HISTORY_SOURCE,
  FINANCIAL_GOAL_HISTORY_STATUS,
} from "./financial-goal-history/financial-goal-history.enum";
import type { CompleteAutoContributionDto } from "./dto/update.dto";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";

export interface FinancialGoalPagingResult {
  items: (FinancialGoalEntity & {
    progressPercentage: number;
  })[];

  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface FinancialGoalProjectionResult {
  goalId: number;

  targetAmount: number;

  currentAmount: number;

  remainingAmount: number;

  monthlyAmount: number;

  estimatedMonthsToTarget: number | null;
}

@Injectable()
export class FinancialGoalService extends BaseCrudService<FinancialGoalEntity> {
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

  /**
   * yyyy-MM
   */
  private getCurrentPeriod(): string {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  }

  private calculateProgress(
    currentAmount: number,
    targetAmount: number,
  ): number {
    if (targetAmount <= 0) {
      return 0;
    }

    return Math.min(
      Number(((currentAmount / targetAmount) * 100).toFixed(2)),
      100,
    );
  }

  private enrichGoal(goal: FinancialGoalEntity) {
    console.log("Enriching goal:", goal);
    return {
      ...goal,
      progressPercentage: this.calculateProgress(
        goal.currentAmount,
        goal.targetAmount,
      ),
    };
  }

  private async findUserGoal(
    goalId: number,
    userId: number,
    relations: string[] = [],
  ): Promise<FinancialGoalEntity> {
    const goal = await this.goalRepository.findOne({
      where: {
        id: goalId,
        account: {
          id: userId,
        },
      },
      relations,
    });

    if (!goal) {
      throw new NotFoundException(`Financial Goal #${goalId} not found`);
    }

    return goal;
  }

  override async create(
    data: CreateFinancialGoalDto,
    relations?: Record<string, number>,
  ): Promise<FinancialGoalEntity> {
    if (data.savingMode === FINANCIAL_GOAL_SAVING_MODE.AUTO) {
      if (!data.autoContributionAmount || !data.autoContributionDay) {
        throw new BadRequestException(
          "AUTO saving mode requires autoContributionAmount and autoContributionDay",
        );
      }
    }

    if (data.savingMode === FINANCIAL_GOAL_SAVING_MODE.MANUAL) {
      data.autoContributionAmount = undefined;
      data.autoContributionDay = undefined;
    }

    return super.create(data, relations);
  }

  override async paging(
    pagination: PaginationQuery<FinancialGoalEntity>,
    options?: {
      relations?: (query: unknown) => void;
    },
  ): Promise<FinancialGoalPagingResult> {
    const result = await super.paging(pagination, options);

    return {
      ...result,
      items: result.items.map((goal) => this.enrichGoal(goal)),
    };
  }

  async getDetail(
    goalId: number,
    userId: number,
  ): Promise<{
    goal: FinancialGoalEntity & {
      progressPercentage: number;
    };

    histories: FinancialGoalHistoryEntity[];
  }> {
    // const goal = await this.findUserGoal(goalId, userId, ["histories"]);
    const goal = await this.goalRepository.findOne({
      where: {
        id: goalId,
        account: {
          id: userId,
        },
      },
      relations: ["histories"],
    });

    console.log("Goal fetched:", goal);

    if (!goal) {
      throw new NotFoundException(`Financial Goal #${goalId} not found`);
    }

    return {
      goal: this.enrichGoal(goal),
      histories: goal.histories ?? [],
    };
  }

  async getProjection(
    goalId: number,
    _query: FinancialGoal_Projection_Request,
    user: JwtPayload,
  ): Promise<FinancialGoalProjectionResult> {
    const goal = await this.findUserGoal(goalId, user.sub);

    const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);

    const monthlyAmount =
      goal.savingMode === FINANCIAL_GOAL_SAVING_MODE.AUTO
        ? (goal.autoContributionAmount ?? 0)
        : 0;

    const estimatedMonthsToTarget =
      monthlyAmount > 0 ? Math.ceil(remainingAmount / monthlyAmount) : null;

    return {
      goalId: goal.id,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount,
      monthlyAmount,
      estimatedMonthsToTarget,
    };
  }
  private updateGoalProgress(
    goal: FinancialGoalEntity,
    contributionAmount: number,
  ): void {
    goal.currentAmount += contributionAmount;

    if (goal.currentAmount >= goal.targetAmount) {
      goal.currentAmount = goal.targetAmount;
      goal.status = FINANCIAL_GOAL_STATUS.COMPLETED;
    }
  }

  async addManualContribution(
    goalId: number,
    userId: number,
    dto: AddManualContributionDto,
  ): Promise<{
    history: FinancialGoalHistoryEntity;
    currentAmount: number;
    isCompleted: boolean;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const goal = await manager.findOne(FinancialGoalEntity, {
        where: {
          id: goalId,
          account: {
            id: userId,
          },
        },
        lock: {
          mode: "pessimistic_write",
        },
      });

      if (!goal) {
        throw new NotFoundException(`Financial Goal #${goalId} not found`);
      }

      if (goal.status !== FINANCIAL_GOAL_STATUS.ACTIVE) {
        throw new BadRequestException("Goal is not active");
      }

      const history = manager.create(FinancialGoalHistoryEntity, {
        goalId: goal.id,
        period: dto.period ?? this.getCurrentPeriod(),

        plannedAmount: dto.amount,

        amount: dto.amount,

        source: FINANCIAL_GOAL_HISTORY_SOURCE.USER,

        status: FINANCIAL_GOAL_HISTORY_STATUS.COMPLETED,

        note: dto.note,

        completedAt: new Date(),
      });

      await manager.save(history);

      this.updateGoalProgress(goal, dto.amount);

      await manager.save(goal);

      return {
        history,

        currentAmount: goal.currentAmount,

        isCompleted: goal.currentAmount >= goal.targetAmount,
      };
    });
  }
  async completePendingHistory(
    historyId: number,
    userId: number,
    dto: CompleteAutoContributionDto,
  ): Promise<{
    history: FinancialGoalHistoryEntity;
    currentAmount: number;
    status: FINANCIAL_GOAL_STATUS;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const history = await manager.findOne(FinancialGoalHistoryEntity, {
        where: {
          id: historyId,
        },
        relations: ["goal"],
        lock: {
          mode: "pessimistic_write",
        },
      });

      if (!history) {
        throw new NotFoundException(`History #${historyId} not found`);
      }

      if (history.goal.accountId !== userId) {
        throw new BadRequestException("Unauthorized");
      }

      if (history.status !== FINANCIAL_GOAL_HISTORY_STATUS.PENDING) {
        throw new BadRequestException("History is not pending");
      }

      history.amount = dto.amount;

      history.status = FINANCIAL_GOAL_HISTORY_STATUS.COMPLETED;

      history.note = dto.note ?? history.note;

      history.completedAt = new Date();

      await manager.save(history);

      this.updateGoalProgress(history.goal, dto.amount);

      await manager.save(history.goal);

      return {
        history,

        currentAmount: history.goal.currentAmount,

        status: history.goal.status,
      };
    });
  }
  async skipHistory(
    historyId: number,
    userId: number,
  ): Promise<FinancialGoalHistoryEntity> {
    const history = await this.historyRepository.findOne({
      where: {
        id: historyId,
      },
      relations: ["goal"],
    });

    if (!history) {
      throw new NotFoundException(`History #${historyId} not found`);
    }

    if (history.goal.accountId !== userId) {
      throw new BadRequestException("Unauthorized");
    }

    if (history.status !== FINANCIAL_GOAL_HISTORY_STATUS.PENDING) {
      throw new BadRequestException("Only pending history can be skipped");
    }

    history.status = FINANCIAL_GOAL_HISTORY_STATUS.SKIPPED;

    history.amount = 0;

    return this.historyRepository.save(history);
  }
  async cancelGoal(
    goalId: number,
    userId: number,
  ): Promise<FinancialGoalEntity> {
    const goal = await this.findUserGoal(goalId, userId);

    if (goal.status !== FINANCIAL_GOAL_STATUS.ACTIVE) {
      throw new BadRequestException("Only active goal can be cancelled");
    }

    goal.status = FINANCIAL_GOAL_STATUS.CANCELLED;

    return this.goalRepository.save(goal);
  }

  async walletBalanceApplyGoal(user: JwtPayload): Promise<any> {
    // {
    //   unApplyWallet: {
    //     totalCurrentAmount: number;
    //     totalTargetAmount: number;
    //     percentage: number;
    //   };
    //   applyWallet: {
    //     totalCurrentAmount: number;
    //     totalTargetAmount: number;
    //     percentage: number;
    //   };
    //   walletBalance: number;
    //   totalActiveGoalAmount: number;
    // }
    const walletBalanceResult: { totalAmount: string }[] =
      await this.dataSource.query(
        `
      SELECT COALESCE(SUM(balance), 0) as "totalAmount"
      FROM "financial-wallet"
      WHERE "accountId" = $1
      `,
        [user.sub],
      );

    const walletBalance = Number(walletBalanceResult[0].totalAmount);

    const goals = await this.goalRepository.find({
      where: {
        account: {
          id: user.sub,
        },
      },
    });

    const activeGoals = goals.filter(
      (goal) => goal.status === FINANCIAL_GOAL_STATUS.ACTIVE,
    );

    const inactiveGoals = goals.filter(
      (goal) => goal.status !== FINANCIAL_GOAL_STATUS.ACTIVE,
    );

    const calculateGoalSummary = (items: typeof goals) => {
      const totalCurrentAmount = items.reduce(
        (sum, goal) => sum + Number(goal.currentAmount ?? 0),
        0,
      );

      const totalTargetAmount = items.reduce(
        (sum, goal) => sum + Number(goal.targetAmount ?? 0),
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

    const active = calculateGoalSummary(activeGoals);
    const inActive = calculateGoalSummary(inactiveGoals);

    return {
      walletBalance,
      totalActiveGoalAmount: active.totalCurrentAmount,
      active,
      inActive,
    };
  }
}
