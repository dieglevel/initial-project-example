import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseCrudService } from "@/common/service/base-crud.service";
import { FinancialNotificationEntity } from "./_entities/financial-notification.entity";
import { Repository } from "typeorm";
import { FinancialCategoryEntity } from "../financial-category/_entities/financial-category.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import {
  FINANCIAL_NOTIFICATION_LEVEL,
  FINANCIAL_NOTIFICATION_TYPE,
} from "./financial-notification.enum";
import { FINANCIAL_CATEGORY_TYPE } from "../financial-category/financial-category.enum";
import { FINANCIAL_TRANSACTION_TYPE } from "../financial-transaction/financial-transaction.enum";
import type { JwtPayload } from "@/module/auth/payload.type";
import type { FinancialNotification_RunSmartAlerts_Response } from "./dto/run-smart-alerts.dto";
import { FINANCIAL_WALLET_TYPE } from "../financial-wallet/financial-wallet.enum";

@Injectable()
export class FinancialNotificationService extends BaseCrudService<FinancialNotificationEntity> {
  constructor(
    @InjectRepository(FinancialNotificationEntity)
    private readonly notificationRepository: Repository<FinancialNotificationEntity>,

    @InjectRepository(FinancialCategoryEntity)
    private readonly categoryRepository: Repository<FinancialCategoryEntity>,

    @InjectRepository(FinancialWalletEntity)
    private readonly walletRepository: Repository<FinancialWalletEntity>,

    @InjectRepository(FinancialTransactionEntity)
    private readonly transactionRepository: Repository<FinancialTransactionEntity>,
  ) {
    super(notificationRepository);
  }

  async getUnread(user: JwtPayload): Promise<FinancialNotificationEntity[]> {
    return this.notificationRepository.find({
      where: {
        account: {
          id: user.sub,
        },
        isRead: false,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async markAsRead(id: number, user: JwtPayload): Promise<{ message: string }> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id,
        account: {
          id: user.sub,
        },
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);

    return {
      message: "Notification marked as read",
    };
  }

  async runSmartAlertsForAccount(
    user: JwtPayload,
  ): Promise<FinancialNotification_RunSmartAlerts_Response> {
    return this.runSmartAlerts({ accountId: user.sub });
  }

  async runSmartAlertsForAllAccounts(): Promise<void> {
    await this.runSmartAlerts({});
  }

  private async runSmartAlerts({
    accountId,
  }: {
    accountId?: number;
  }): Promise<FinancialNotification_RunSmartAlerts_Response> {
    const budgetAlertsCreated = await this.createBudgetAlerts(accountId);
    const creditCardAlertsCreated =
      await this.createCreditCardDueAlerts(accountId);

    return {
      budgetAlertsCreated,
      creditCardAlertsCreated,
    };
  }

  private async createBudgetAlerts(accountId?: number): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const categories = await this.categoryRepository.find({
      where: {
        archived: false,
        ...(accountId
          ? {
              account: {
                id: accountId,
              },
            }
          : {}),
      },
      relations: {
        account: true,
      },
    });

    const filteredCategories = categories.filter(
      (category) =>
        (!category.type || category.type === FINANCIAL_CATEGORY_TYPE.EXPENSE) &&
        Number(category.monthlyBudget) > 0,
    );

    const spentRows = await this.transactionRepository
      .createQueryBuilder("transaction")
      .select("transaction.accountId", "accountId")
      .addSelect("transaction.categoryId", "categoryId")
      .addSelect("COALESCE(SUM(transaction.amount), 0)", "spent")
      .where("transaction.createdAt BETWEEN :start AND :end", {
        start: startOfMonth,
        end: endOfMonth,
      })
      .andWhere("transaction.type = :type", {
        type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
      })
      .andWhere("transaction.categoryId IS NOT NULL")
      .groupBy("transaction.accountId")
      .addGroupBy("transaction.categoryId")
      .getRawMany<{
        accountId: string;
        categoryId: string;
        spent: string;
      }>();

    const spentMap = new Map<string, number>();

    for (const row of spentRows) {
      const key = `${row.accountId}:${row.categoryId}`;
      spentMap.set(key, Number(row.spent ?? 0));
    }

    let createdCount = 0;
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    for (const category of filteredCategories) {
      const key = `${category.account.id}:${category.id}`;
      const spentAmount = spentMap.get(key) ?? 0;
      const budget = Number(category.monthlyBudget ?? 0);
      const percentage = budget > 0 ? (spentAmount / budget) * 100 : 0;

      let level: FINANCIAL_NOTIFICATION_LEVEL | null = null;
      let thresholdLabel: "80" | "100" | null = null;

      if (percentage >= 100) {
        level = FINANCIAL_NOTIFICATION_LEVEL.CRITICAL;
        thresholdLabel = "100";
      } else if (percentage >= 80) {
        level = FINANCIAL_NOTIFICATION_LEVEL.WARNING;
        thresholdLabel = "80";
      }

      if (!level || !thresholdLabel) {
        continue;
      }

      const dedupeKey = `BUDGET:${category.id}:${monthKey}:${thresholdLabel}`;

      const created = await this.createNotificationIfAbsent({
        accountId: category.account.id,
        dedupeKey,
        type: FINANCIAL_NOTIFICATION_TYPE.BUDGET_ALERT,
        level,
        title:
          thresholdLabel === "100"
            ? `Budget exceeded: ${category.name}`
            : `Budget reached 80%: ${category.name}`,
        message: `Spent ${spentAmount.toLocaleString()} / ${budget.toLocaleString()} in category ${category.name}.`,
        metadata: {
          categoryId: category.id,
          spentAmount,
          monthlyBudget: budget,
          percentage: Number(percentage.toFixed(2)),
          month: monthKey,
        },
      });

      if (created) {
        createdCount += 1;
      }
    }

    return createdCount;
  }

  private async createCreditCardDueAlerts(accountId?: number): Promise<number> {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const wallets = await this.walletRepository.find({
      where: {
        type: FINANCIAL_WALLET_TYPE.CREDIT_CARD,
        ...(accountId
          ? {
              account: {
                id: accountId,
              },
            }
          : {}),
      },
      relations: {
        account: true,
      },
    });

    let createdCount = 0;

    for (const wallet of wallets) {
      const dueDay = Number(wallet.dueDay ?? 0);
      const currentDebt = Number(wallet.currentDebt ?? 0);

      if (dueDay < 1 || dueDay > 31 || currentDebt <= 0) {
        continue;
      }

      const dueDate = this.getNextDueDate(startOfToday, dueDay);
      const diffDays = Math.floor(
        (dueDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (diffDays < 0 || diffDays > 3) {
        continue;
      }

      const dueDateKey = dueDate.toISOString().slice(0, 10);
      const dedupeKey = `CC_DUE:${wallet.id}:${dueDateKey}`;

      const created = await this.createNotificationIfAbsent({
        accountId: wallet.account.id,
        dedupeKey,
        type: FINANCIAL_NOTIFICATION_TYPE.CREDIT_CARD_DUE,
        level:
          diffDays === 0
            ? FINANCIAL_NOTIFICATION_LEVEL.CRITICAL
            : FINANCIAL_NOTIFICATION_LEVEL.WARNING,
        title:
          diffDays === 0
            ? `Credit card due today: ${wallet.name}`
            : `Credit card due in ${diffDays} day(s): ${wallet.name}`,
        message: `Current debt ${currentDebt.toLocaleString()} is due on ${dueDateKey}.`,
        metadata: {
          walletId: wallet.id,
          dueDay,
          dueDate: dueDateKey,
          currentDebt,
          daysUntilDue: diffDays,
        },
      });

      if (created) {
        createdCount += 1;
      }
    }

    return createdCount;
  }

  private getNextDueDate(fromDate: Date, dueDay: number): Date {
    const makeDate = (year: number, month: number) => {
      const maxDay = new Date(year, month + 1, 0).getDate();
      return new Date(year, month, Math.min(dueDay, maxDay), 0, 0, 0, 0);
    };

    const thisMonthDue = makeDate(fromDate.getFullYear(), fromDate.getMonth());

    if (thisMonthDue >= fromDate) {
      return thisMonthDue;
    }

    return makeDate(fromDate.getFullYear(), fromDate.getMonth() + 1);
  }

  private async createNotificationIfAbsent({
    accountId,
    type,
    level,
    title,
    message,
    metadata,
    dedupeKey,
  }: {
    accountId: number;
    type: FINANCIAL_NOTIFICATION_TYPE;
    level: FINANCIAL_NOTIFICATION_LEVEL;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    dedupeKey?: string;
  }): Promise<boolean> {
    if (dedupeKey) {
      const existing = await this.notificationRepository.findOne({
        where: {
          dedupeKey,
          account: {
            id: accountId,
          },
        },
      });

      if (existing) {
        return false;
      }
    }

    const notification = this.notificationRepository.create({
      title,
      message,
      type,
      level,
      dedupeKey,
      metadata,
      isRead: false,
      account: {
        id: accountId,
      },
    });

    await this.notificationRepository.save(notification);
    return true;
  }
}
