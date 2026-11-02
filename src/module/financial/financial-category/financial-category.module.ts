import { Module } from "@nestjs/common";
import { FinancialCategoryService } from "./financial-category.service";
import { FinancialCategoryController } from "./financial-category.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialCategoryEntity } from "./_entities/financial-category.entity";
import { FinancialCategoryBudgetEntity } from "./_entities/financial-category-budget.entity";
import { FinancialCategoryBudgetService } from "./financial-category-budget.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialCategoryEntity,
      FinancialCategoryBudgetEntity,
    ]),
  ],
  controllers: [FinancialCategoryController],
  providers: [FinancialCategoryService, FinancialCategoryBudgetService],
  exports: [FinancialCategoryService, FinancialCategoryBudgetService],
})
export class FinancialCategoryModule {}
