import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialGoalEntity } from "./_entities/financial-goal.entity";
import { FinancialGoalController } from "./financial-goal.controller";
import { FinancialGoalService } from "./financial-goal.service";
import { FinancialGoalCron } from "./financial.goal.cron";
import { FinancialGoalHistoryEntity } from "./financial-goal-history/_entities/financial-goal-history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialGoalEntity, FinancialGoalHistoryEntity]),
  ],
  controllers: [FinancialGoalController],
  providers: [FinancialGoalService, FinancialGoalCron],
  exports: [FinancialGoalService],
})
export class FinancialGoalModule {}
