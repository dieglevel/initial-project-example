import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialIncomePlanController } from "./financial-income-plan.controller";
import { FinancialIncomePlanService } from "./financial-income-plan.service";
import { FinancialIncomePlanEntity } from "./_entities/financial-income-plan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialIncomePlanEntity])],
  controllers: [FinancialIncomePlanController],
  providers: [FinancialIncomePlanService],
  exports: [FinancialIncomePlanService],
})
export class FinancialIncomePlanModule {}
