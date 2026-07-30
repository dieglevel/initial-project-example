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
import { FINANCIAL_TRANSACTION_TYPE } from "../financial-transaction/financial-transaction.enum";
import type { JwtPayload } from "@/module/auth/payload.type";

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
    user,
  }: {
    date: FinancialCategory_GetWithTransactionCount_Request["date"];
    user: JwtPayload;
  }): Promise<FinancialCategory_GetWithTransactionCount_Response[]> {
    const selectedDate = dayjs(date).isValid() ? dayjs(date) : dayjs();

    const startDate = selectedDate.startOf("month").toDate();
    const endDate = selectedDate.endOf("month").toDate();

    const queryBuilder = this.FinancialCategoryRepository.createQueryBuilder(
      "financialCategory",
    )
      .leftJoin(
        "financialCategory.transactions",
        "transaction",
        `
      transaction.createdAt >= :startDate
      AND transaction.createdAt <= :endDate
      AND transaction.type = :type
      AND transaction.deletedAt IS NULL
      `,
        {
          startDate,
          endDate,
          type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        },
      )
      .where("financialCategory.accountId = :accountId", {
        accountId: user.sub,
      })
      .addSelect("COALESCE(SUM(transaction.amount), 0)", "totalAmount")
      .groupBy("financialCategory.id");

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((entity, index) => ({
      ...entity,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      totalAmount: Number(raw[index]?.totalAmount ?? 0),
    }));
  }
}
