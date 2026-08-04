import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseCrudService } from "@/common/service/base-crud.service";
import { FinancialRecurringEntity } from "./_entities/financial-recurring.entity";
import { LessThanOrEqual, Repository } from "typeorm";
import { FinancialTransactionService } from "../financial-transaction/financial-transaction.service";
import {
  FINANCIAL_RECURRING_FREQUENCY,
  FINANCIAL_RECURRING_TYPE,
} from "./financial-recurring.enum";
import type { JwtPayload } from "@/module/auth/payload.type";
import type { FinancialRecurring_RunDue_Response } from "./dto/run-due.dto";
import { FINANCIAL_TRANSACTION_TYPE } from "../financial-transaction/financial-transaction.enum";
import dayjs from "dayjs";

@Injectable()
export class FinancialRecurringService extends BaseCrudService<FinancialRecurringEntity> {
  constructor(
    @InjectRepository(FinancialRecurringEntity)
    private readonly recurringRepository: Repository<FinancialRecurringEntity>,
    private readonly transactionService: FinancialTransactionService,
  ) {
    super(recurringRepository);
  }

  async runDueForAccount(
    user: JwtPayload,
  ): Promise<FinancialRecurring_RunDue_Response> {
    return this.processDue({ accountId: user.sub });
  }

  async runDueForAllAccounts(): Promise<FinancialRecurring_RunDue_Response> {
    return this.processDue({});
  }

  private async processDue({
    accountId,
  }: {
    accountId?: number;
  }): Promise<FinancialRecurring_RunDue_Response> {
    const now = new Date();

    const dueRules = await this.recurringRepository.find({
      where: {
        isActive: true,
        isAutoCreate: true,
        nextRunAt: LessThanOrEqual(now),
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
      order: {
        nextRunAt: "ASC",
      },
    });

    let createdTransactions = 0;
    let reminderRules = 0;
    let failedRules = 0;

    for (const rule of dueRules) {
      try {
        if (rule.reminderOnly) {
          reminderRules += 1;
        } else {
          // Map đúng kiểu giao dịch dựa vào FINANCIAL_RECURRING_TYPE thực tế
          let transactionType = FINANCIAL_TRANSACTION_TYPE.EXPENSE;
          if (rule.recurringType === FINANCIAL_RECURRING_TYPE.SALARY) {
            transactionType = FINANCIAL_TRANSACTION_TYPE.INCOME;
          }

          // Không truyền categoryId vì createAutomatedTransaction chưa nhận param này
          await this.transactionService.createAutomatedTransaction({
            accountId: rule.account.id,
            walletId: rule.walletId,
            amount: Number(rule.amount),
            categoryId: rule.categoryId ?? undefined, // <-- Đã hoạt động hợp lệ!
            description: rule.description ?? rule.name,
            merchant: rule.merchant ?? undefined,
            location: rule.location ?? undefined,
            tags: rule.tags ?? undefined,
            type: transactionType,
            date: rule.nextRunAt ? new Date(rule.nextRunAt) : now,
          });

          createdTransactions += 1;
        }

        // Cập nhật trạng thái
        rule.lastRunAt = now;

        // Tính thời điểm tiếp theo từ nextRunAt cũ để chống trôi lịch
        const nextDate = this.computeNextRunAt(
          rule,
          rule.nextRunAt ? new Date(rule.nextRunAt) : now,
        );

        rule.nextRunAt = nextDate;

        await this.recurringRepository.save(rule);
      } catch {
        failedRules += 1;
      }
    }

    return {
      totalDueRules: dueRules.length,
      createdTransactions,
      reminderRules,
      failedRules,
    };
  }

  private computeNextRunAt(
    rule: FinancialRecurringEntity,
    baseDate: Date,
  ): Date {
    let next = dayjs(baseDate);

    if (rule.frequency === FINANCIAL_RECURRING_FREQUENCY.WEEKLY) {
      return next.add(1, "week").toDate();
    }

    if (rule.frequency === FINANCIAL_RECURRING_FREQUENCY.EVERY_N_DAYS) {
      const days = Math.max(1, Number(rule.intervalDays ?? 1));
      return next.add(days, "day").toDate();
    }

    if (rule.frequency === FINANCIAL_RECURRING_FREQUENCY.MONTHLY) {
      const targetDay = Math.max(
        1,
        Math.min(31, Number(rule.dayOfMonth ?? next.date())),
      );

      next = next.add(1, "month");

      const daysInMonth = next.daysInMonth();
      const finalDay = Math.min(targetDay, daysInMonth);

      return next.date(finalDay).toDate();
    }

    return next.add(1, "month").toDate();
  }
}
