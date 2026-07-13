import { Module } from "@nestjs/common";
import { FinancialCategoryService } from "./financial-category.service";
import { FinancialCategoryController } from "./financial-category.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialCategoryEntity } from "./_entities/financial-category.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialCategoryEntity])],
  controllers: [FinancialCategoryController],
  providers: [FinancialCategoryService],
  exports: [FinancialCategoryService],
})
export class FinancialCategoryModule {}
