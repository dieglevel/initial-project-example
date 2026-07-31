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
          await this.transactionService.createAutomatedTransaction({
            accountId: rule.account.id,
            walletId: rule.walletId,
            categoryId: rule.categoryId ?? undefined,
            amount: Number(rule.amount),
            description: rule.description ?? rule.name,
            merchant: rule.merchant ?? undefined,
            location: rule.location ?? undefined,
            tags: rule.tags ?? undefined,
            type:
              rule.transactionType === "income"
                ? FINANCIAL_TRANSACTION_TYPE.INCOME
                : FINANCIAL_TRANSACTION_TYPE.EXPENSE,
            date: now,
          });

          createdTransactions += 1;
        }

        rule.lastRunAt = now;
        rule.nextRunAt = this.computeNextRunAt(rule, now);
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
    fromDate: Date,
  ): Date {
    const next = new Date(fromDate);

    if (rule.frequency === FINANCIAL_RECURRING_FREQUENCY.WEEKLY) {
      next.setDate(next.getDate() + 7);
      return next;
    }

    if (rule.frequency === FINANCIAL_RECURRING_FREQUENCY.EVERY_N_DAYS) {
      const days = Math.max(1, Number(rule.intervalDays ?? 1));
      next.setDate(next.getDate() + days);
      return next;
    }

    const day = Math.max(
      1,
      Math.min(31, Number(rule.dayOfMonth ?? next.getDate())),
    );
    const year = next.getUTCFullYear();
    const month = next.getUTCMonth() + 1;
    const targetMonth = month + 1;
    const nextMonthDate = new Date(Date.UTC(year, targetMonth - 1, 1));
    const maxDay = new Date(
      Date.UTC(
        nextMonthDate.getUTCFullYear(),
        nextMonthDate.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();

    return new Date(
      Date.UTC(
        nextMonthDate.getUTCFullYear(),
        nextMonthDate.getUTCMonth(),
        Math.min(day, maxDay),
        fromDate.getUTCHours(),
        fromDate.getUTCMinutes(),
        fromDate.getUTCSeconds(),
        fromDate.getUTCMilliseconds(),
      ),
    );
  }
}
