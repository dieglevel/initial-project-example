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
import { FINANCIAL_CATEGORY_TYPE } from "./financial-category.enum";
import {
  FINANCIAL_BUDGET_ALERT_LEVEL,
  type FinancialCategory_GetBudgetStatus_Request,
  type FinancialCategory_GetBudgetStatus_Response,
} from "./dto/get-budget-status.dto";

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
      .andWhere(
        "(financialCategory.type = :categoryType OR financialCategory.type IS NULL)",
        {
          categoryType: FINANCIAL_CATEGORY_TYPE.EXPENSE,
        },
      )
      .addSelect("COALESCE(SUM(transaction.amount), 0)", "totalAmount")
      .groupBy("financialCategory.id");

    const { entities, raw } = await queryBuilder.getRawAndEntities();

    return entities.map((entity, index) => ({
      ...entity,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      totalAmount: Number(raw[index]?.totalAmount ?? 0),
    }));
  }

  async getBudgetStatus({
    date,
    user,
  }: {
    date?: FinancialCategory_GetBudgetStatus_Request["date"];
    user: JwtPayload;
  }): Promise<FinancialCategory_GetBudgetStatus_Response[]> {
    const categories = await this.getCategoriesWithTotals({
      date: date ?? new Date(),
      user,
    });

    return categories.map((category) => {
      const budget = Number(category.monthlyBudget ?? 0);
      const spentAmount = Number(category.totalAmount ?? 0);
      const remainingBudget = budget - spentAmount;
      const spentPercentage =
        budget > 0 ? Number(((spentAmount / budget) * 100).toFixed(2)) : 0;

      let alertLevel = FINANCIAL_BUDGET_ALERT_LEVEL.NORMAL;

      if (budget > 0 && spentPercentage >= 100) {
        alertLevel = FINANCIAL_BUDGET_ALERT_LEVEL.EXCEEDED;
      } else if (budget > 0 && spentPercentage >= 80) {
        alertLevel = FINANCIAL_BUDGET_ALERT_LEVEL.WARNING_80;
      }

      return {
        ...category,
        spentAmount,
        remainingBudget,
        spentPercentage,
        alertLevel,
      };
    });
  }
}
