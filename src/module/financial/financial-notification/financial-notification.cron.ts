import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { FinancialNotificationService } from "./financial-notification.service";

@Injectable()
export class FinancialNotificationCron {
  private readonly logger = new Logger(FinancialNotificationCron.name);

  constructor(
    private readonly financialNotificationService: FinancialNotificationService,
  ) {}

  @Cron("0 8 * * *")
  async runDailySmartAlerts() {
    await this.financialNotificationService.runSmartAlertsForAllAccounts();
    this.logger.log("Daily financial smart alerts executed.");
  }
}
