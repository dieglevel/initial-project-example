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
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FinancialAdvanceTransactionEntity } from "../financial-transaction/financial-advance-transaction/_entities/financial-advance-transaction.entity";

@Injectable()
export class FinancialCategoryService extends BaseCrudService<FinancialCategoryEntity> {
  constructor(
    @InjectRepository(FinancialCategoryEntity)
    private readonly financialCategoryRepository: Repository<FinancialCategoryEntity>,
  ) {
    super(financialCategoryRepository);
  }

  async gets({
    date,
    user,
  }: {
    date: FinancialCategory_GetWithTransactionCount_Request["date"];
    user: JwtPayload;
  }): Promise<FinancialCategory_GetWithTransactionCount_Response[]> {
    const selectedDate = dayjs(date).isValid() ? dayjs(date) : dayjs();

    const startDate = selectedDate.startOf("month").toDate();
    const endDate = selectedDate.endOf("month").toDate();

    /**
     * 1. Get all categories
     */
    const categories = await this.financialCategoryRepository
      .createQueryBuilder("financialCategory")
      .leftJoinAndSelect(
        "financialCategory.children",
        "children",
        "children.deletedAt IS NULL",
      )
      .where(`"financialCategory"."accountId" = :accountId`, {
        accountId: user.sub,
      })
      .andWhere(
        `(
        "financialCategory"."type" = :categoryType
        OR "financialCategory"."type" IS NULL
      )`,
        {
          categoryType: FINANCIAL_CATEGORY_TYPE.EXPENSE,
        },
      )
      .andWhere(`"financialCategory"."deletedAt" IS NULL`)
      .orderBy(`"financialCategory"."createdAt"`, "ASC")
      .getMany();

    /**
     * 2. Get actual amount by category
     *
     * Important:
     * Do NOT join children here.
     * Each category gets its own direct transaction amount.
     */
    const transactionTotals = await this.financialCategoryRepository
      .createQueryBuilder("financialCategory")
      .leftJoin(
        FinancialAdvanceTransactionEntity,
        "advanceTransactions",
        `
        "advanceTransactions"."categoryId" = "financialCategory"."id"
        AND "advanceTransactions"."deletedAt" IS NULL
      `,
      )
      .leftJoin(
        FinancialTransactionEntity,
        "transaction",
        `
        "transaction"."id" = "advanceTransactions"."transactionId"
        AND "transaction"."createdAt" >= :startDate
        AND "transaction"."createdAt" <= :endDate
        AND "transaction"."type" = :transactionType
        AND "transaction"."deletedAt" IS NULL
      `,
      )
      .select(`"financialCategory"."id"`, "categoryId")
      .addSelect(`COALESCE(SUM("transaction"."amount"), 0)`, "totalAmount")
      .where(`"financialCategory"."accountId" = :accountId`, {
        accountId: user.sub,
      })
      .andWhere(
        `(
        "financialCategory"."type" = :categoryType
        OR "financialCategory"."type" IS NULL
      )`,
        {
          categoryType: FINANCIAL_CATEGORY_TYPE.EXPENSE,
        },
      )
      .andWhere(`"financialCategory"."deletedAt" IS NULL`)
      .groupBy(`"financialCategory"."id"`)
      .orderBy(`"financialCategory"."createdAt"`, "ASC")
      .setParameters({
        startDate,
        endDate,
        transactionType: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
      })
      .getRawMany<{
        categoryId: number;
        totalAmount: string;
      }>();

    /**
     * 3. Map direct transaction amount
     */
    const directAmountMap = new Map<number, number>();

    for (const item of transactionTotals) {
      directAmountMap.set(
        Number(item.categoryId),
        Number(item.totalAmount ?? 0),
      );
    }

    /**
     * 4. Build tree
     */
    const categoryMap = new Map<
      number,
      FinancialCategory_GetWithTransactionCount_Response
    >();

    for (const category of categories) {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        totalAmount: directAmountMap.get(category.id) ?? 0,
      });
    }

    const roots: FinancialCategory_GetWithTransactionCount_Response[] = [];

    /**
     * 5. Attach children
     */
    for (const category of categoryMap.values()) {
      if (category.parentId === null) {
        roots.push(category);
        continue;
      }

      const parent = categoryMap.get(category.parentId ?? 0);

      if (parent) {
        parent.children?.push(category);
      }
    }

    /**
     * 6. Aggregate totalAmount recursively
     *
     * parent.totalAmount =
     *   own transaction
     *   + children.totalAmount
     */
    const calculateTotal = (
      category: FinancialCategory_GetWithTransactionCount_Response,
    ): number => {
      const childrenTotal = category?.children?.reduce(
        (sum, child) =>
          sum +
          calculateTotal(
            child as FinancialCategory_GetWithTransactionCount_Response,
          ),
        0,
      );

      category.totalAmount += childrenTotal || 0;

      return category.totalAmount;
    };

    for (const root of roots) {
      calculateTotal(root);
    }

    return roots;
  }

  async getBudgetStatus({
    date,
    user,
  }: {
    date?: FinancialCategory_GetBudgetStatus_Request["date"];
    user: JwtPayload;
  }): Promise<FinancialCategory_GetBudgetStatus_Response[]> {
    const categories = await this.gets({
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

  async archiveCategory(categoryId: number, user: JwtPayload): Promise<void> {
    const category = await this.financialCategoryRepository.findOne({
      where: {
        id: categoryId,
        account: {
          id: user.sub,
        },
      },
      select: {
        id: true,
        archived: true,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const archived = !category.archived;

    await this.financialCategoryRepository.query(
      `
      WITH RECURSIVE category_tree AS (
        -- Root category
        SELECT id
        FROM "financial-category"
        WHERE id = $1
          AND "accountId" = $2

        UNION ALL

        -- Children
        SELECT child.id
        FROM "financial-category" child
        INNER JOIN category_tree parent
          ON child."parentId" = parent.id
        WHERE child."accountId" = $2
      )

      UPDATE "financial-category"
      SET archived = $3
      WHERE id IN (
        SELECT id
        FROM category_tree
      )
    `,
      [categoryId, user.sub, archived],
    );
  }
}
