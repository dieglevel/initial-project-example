import { Module } from "@nestjs/common";
import { FinancialCategoryService } from "./financial-category.service";
import { FinancialCategoryController } from "./financial-category.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialCategoryEntity } from "./_entities/financial-category.entity";
import { FinancialCategoryBudgetEntity } from "./_entities/financial-category-budget.entity";
import { FinancialCategoryBudgetService } from "./financial-category-budget.service";
import { FinancialIncomePlanEntity } from "../financial-income-plan/_entities/financial-income-plan.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialCategoryEntity,
      FinancialCategoryBudgetEntity,
      FinancialIncomePlanEntity,
    ]),
  ],
  controllers: [FinancialCategoryController],
  providers: [FinancialCategoryService, FinancialCategoryBudgetService],
  exports: [FinancialCategoryService, FinancialCategoryBudgetService],
})
export class FinancialCategoryModule {}
