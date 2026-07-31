import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { FinancialRecurringService } from "./financial-recurring.service";

@Injectable()
export class FinancialRecurringCron {
  private readonly logger = new Logger(FinancialRecurringCron.name);

  constructor(private readonly recurringService: FinancialRecurringService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async runDueRecurringRules() {
    const result = await this.recurringService.runDueForAllAccounts();

    if (result.totalDueRules > 0) {
      this.logger.log(
        `Recurring run: due=${result.totalDueRules}, created=${result.createdTransactions}, reminders=${result.reminderRules}, failed=${result.failedRules}`,
      );
    }
  }
}
