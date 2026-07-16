import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialCategoryEntity } from "./_entities/financial-category.entity";
import { BaseCrudService } from "@/common/service/base-crud.service";
import type {
  FinancialCategory_GetWithTransactionCount_Request,
  FinancialCategory_GetWithTransactionCount_Response,
} from "./dto/get-with-transaction-count.dto";
import dayjs from "dayjs";

@Injectable()
export class FinancialCategoryService extends BaseCrudService<FinancialCategoryEntity> {
  constructor(
    @InjectRepository(FinancialCategoryEntity)
    private readonly FinancialCategoryRepository: Repository<FinancialCategoryEntity>,
  ) {
    super(FinancialCategoryRepository);
  }

  async getCategoriesWithTotals({
    date,
  }: FinancialCategory_GetWithTransactionCount_Request): Promise<
    FinancialCategory_GetWithTransactionCount_Response[]
  > {
    const queryBuilder = this.FinancialCategoryRepository.createQueryBuilder(
      "financialCategory",
    )
      // 1. Move the condition into the join clause
      .leftJoin(
        "financialCategory.transactions",
        "transaction",
        "transaction.createdAt >= :date",
        {
          date: dayjs(date).isValid()
            ? dayjs(date).startOf("day").toDate()
            : new Date(0),
        },
      )
      .select("financialCategory")
      // 2. Aggregate the amount
      .addSelect("COALESCE(SUM(transaction.amount), 0)", "totalAmount")
      .groupBy("financialCategory.id");

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((entity) => {
      const rawRow = raw.find((r) => r.financialCategory_id === entity.id);

      const totalAmount = rawRow ? Number(rawRow.totalAmount) : 0;

      return {
        ...entity,
        totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      };
    });
  }
}
