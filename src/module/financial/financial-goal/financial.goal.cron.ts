import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class FinancialGoalCron {
  private readonly logger = new Logger(FinancialGoalCron.name);

  @Cron("0 0 1 * *")
  async processAutoContributions() {
    this.logger.log("Start processing financial goal auto contributions");

    // Lấy các goal có autoContributionAmount > 0
    // Kiểm tra ví
    // Trừ tiền
    // Cộng currentAmount
    // Tạo transaction
  }
}
