import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialGoalEntity } from "./_entities/financial-goal.entity";
import { FinancialGoalController } from "./financial-goal.controller";
import { FinancialGoalService } from "./financial-goal.service";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialGoalEntity])],
  controllers: [FinancialGoalController],
  providers: [FinancialGoalService],
  exports: [FinancialGoalService],
})
export class FinancialGoalModule {}
