import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialCategoryEntity } from "./_entities/financial-category.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";
import type { FinancialCategory_GetWithTransactionCount_Response } from "./dto/get-with-transaction-count.dto";

@Injectable()
export class FinancialCategoryService extends BaseCrudService<FinancialCategoryEntity> {
  constructor(
    @InjectRepository(FinancialCategoryEntity)
    private readonly FinancialCategoryRepository: Repository<FinancialCategoryEntity>,
  ) {
    super(FinancialCategoryRepository);
  }

  async getCategoriesWithTotals(): Promise<
    FinancialCategory_GetWithTransactionCount_Response[]
  > {
    const queryBuilder = this.FinancialCategoryRepository.createQueryBuilder(
      "financialCategory",
    )
      .leftJoin("financialCategory.transactions", "transaction")
      .select("financialCategory")
      .addSelect("COALESCE(SUM(transaction.amount), 0)", "totalAmount")
      .groupBy("financialCategory.id");

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((entity, index) => {
      const totalAmount = Number(
        (raw[index] as { totalAmount?: string | number | null })?.totalAmount,
      );

      return {
        ...entity,
        totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      };
    });
  }
}
