import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { FinancialGoalService } from "./financial-goal.service";

@Injectable()
export class FinancialGoalCron {
  private readonly logger = new Logger(FinancialGoalCron.name);

  constructor(private readonly goalService: FinancialGoalService) {}

  /**
   * 00:10 mỗi ngày (giờ VN). Chạy hằng ngày (không chỉ ngày 1) để đúng
   * autoContributionDay của từng mục tiêu và tự bù nếu server tắt vài ngày.
   * Idempotent: mỗi mục tiêu tối đa 1 khoản góp tự động / tháng.
   */
  @Cron("10 0 * * *", { timeZone: "Asia/Ho_Chi_Minh" })
  async processAutoContributions() {
    const result = await this.goalService.runAutoContributions();
    this.logger.log(
      `Goal auto contributions: completed=${result.completed} pending=${result.pending} skipped=${result.skipped} failed=${result.failed}`,
    );
  }
}
