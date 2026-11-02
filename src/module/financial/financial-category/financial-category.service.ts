import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  And,
  In,
  IsNull,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
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

import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FinancialTransactionItemEntity } from "../financial-transaction/_entities/financial-transaction-item.entity";
import { FinancialCategory_GetList_Request } from "./dto/list.dto";
import {
  FinancialCategory_GetTransactionCategory_Request,
  FinancialCategory_GetTransactionCategory_Response,
} from "./dto/get-transaction-category.dto";
import { FinancialCategoryBudgetEntity } from "./_entities/financial-category-budget.entity";
import { DataSource } from "typeorm";
import {
  calculateBudgetMetrics,
  calculateIncomeAllocation,
  type BudgetCategoryNode,
} from "./budget-calculator";
import { FinancialIncomePlanEntity } from "../financial-income-plan/_entities/financial-income-plan.entity";

@Injectable()
export class FinancialCategoryService extends BaseCrudService<FinancialCategoryEntity> {
  constructor(
    @InjectRepository(FinancialCategoryEntity)
    private readonly financialCategoryRepository: Repository<FinancialCategoryEntity>,
    @InjectRepository(FinancialCategoryBudgetEntity)
    private readonly financialCategoryBudgetRepository: Repository<FinancialCategoryBudgetEntity>,
    private readonly dataSource: DataSource,
    @InjectRepository(FinancialIncomePlanEntity)
    private readonly incomePlanRepository: Repository<FinancialIncomePlanEntity>,
  ) {
    super(financialCategoryRepository);
  }

  async gets({
    query,
    user,
  }: {
    query: FinancialCategory_GetList_Request;
    user: JwtPayload;
  }): Promise<FinancialCategory_GetWithTransactionCount_Response[]> {
    const { startDate, endDate } = query;

    const hasStartDate = Boolean(startDate && dayjs(startDate).isValid());
    const hasEndDate = Boolean(endDate && dayjs(endDate).isValid());

    const formattedStartDate = hasStartDate
      ? dayjs(startDate).format("YYYY-MM-DD")
      : null;
    const formattedEndDate = hasEndDate
      ? dayjs(endDate).format("YYYY-MM-DD")
      : null;

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

    const budgetMonth = dayjs(startDate ?? new Date()).format("YYYY-MM");
    await this.ensureBudgetMonth(user.sub, budgetMonth);
    const budgetRows = await this.financialCategoryBudgetRepository.find({
      where: {
        categoryId: In(categories.map((category) => category.id)),
        month: budgetMonth,
      },
    });
    const budgetMap = new Map(
      budgetRows.map((budget) => [budget.categoryId, budget.amount]),
    );
    for (const category of categories) {
      category.monthlyBudget = budgetMap.has(category.id)
        ? (budgetMap.get(category.id) ?? null)
        : null;
      for (const child of category.children ?? []) {
        child.monthlyBudget = budgetMap.has(child.id)
          ? (budgetMap.get(child.id) ?? null)
          : null;
      }
    }

    const directAmountMap = new Map<number, number>();
    let uncategorizedTotal = 0;

    /**
     * Chỉ tính toán số tiền khi có startDate và endDate hợp lệ
     */
    if (hasStartDate && hasEndDate) {
      /**
       * 2. Get direct transaction amount by category
       */
      const transactionTotals = await this.financialCategoryRepository
        .createQueryBuilder("financialCategory")
        .leftJoin(
          FinancialTransactionItemEntity,
          "transactionItem",
          `
          "transactionItem"."categoryId" = "financialCategory"."id"
          AND "transactionItem"."deletedAt" IS NULL
        `,
        )
        .leftJoin(
          FinancialTransactionEntity,
          "transaction",
          `
          "transaction"."id" = "transactionItem"."transactionId"
          AND "transaction"."transactionDate" >= CAST(:startDate AS date)
          AND "transaction"."transactionDate" <= CAST(:endDate AS date)
          AND "transaction"."type" = :transactionType
          AND "transaction"."deletedAt" IS NULL
        `,
        )
        .select(`"financialCategory"."id"`, "categoryId")
        .addSelect(
          `
          COALESCE(
            SUM(
              CASE
                WHEN "transaction"."id" IS NOT NULL
                THEN "transactionItem"."amount"
                ELSE 0
              END
            ),
            0
          )
        `,
          "totalAmount",
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
        .groupBy(`"financialCategory"."id"`)
        .orderBy(`"financialCategory"."createdAt"`, "ASC")
        .setParameters({
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          transactionType: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        })
        .getRawMany<{
          categoryId: number;
          totalAmount: string;
        }>();

      /**
       * 2.5. Tính tổng số tiền cho các item "Chưa phân loại"
       */
      const uncategorizedResult = await this.financialCategoryRepository.manager
        .createQueryBuilder(FinancialTransactionItemEntity, "transactionItem")
        .innerJoin(
          FinancialTransactionEntity,
          "transaction",
          `
          "transaction"."id" = "transactionItem"."transactionId"
          AND "transaction"."transactionDate" >= CAST(:startDate AS date)
          AND "transaction"."transactionDate" <= CAST(:endDate AS date)
          AND "transaction"."type" = :transactionType
          AND "transaction"."deletedAt" IS NULL
        `,
        )
        .select(`COALESCE(SUM("transactionItem"."amount"), 0)`, "totalAmount")
        .where(`"transactionItem"."categoryId" IS NULL`)
        .andWhere(`"transactionItem"."deletedAt" IS NULL`)
        .andWhere(`"transaction"."accountId" = :accountId`, {
          accountId: user.sub,
        })
        .setParameters({
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          transactionType: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        })
        .getRawOne<{ totalAmount: string }>();

      uncategorizedTotal = Number(uncategorizedResult?.totalAmount ?? 0);

      /**
       * Map direct transaction amount
       */
      for (const item of transactionTotals) {
        directAmountMap.set(
          Number(item.categoryId),
          Number(item.totalAmount ?? 0),
        );
      }
    }

    /**
     * 3. Build tree
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
     * 4. Attach children
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
     * 5. Aggregate totalAmount recursively (chỉ chạy nếu có startDate và endDate)
     */
    if (hasStartDate && hasEndDate) {
      const calculateTotal = (
        category: FinancialCategory_GetWithTransactionCount_Response,
      ): number => {
        const childrenTotal =
          category.children?.reduce((sum, child) => {
            return (
              sum +
              calculateTotal(
                child as FinancialCategory_GetWithTransactionCount_Response,
              )
            );
          }, 0) ?? 0;

        category.totalAmount += childrenTotal;

        return category.totalAmount;
      };

      for (const root of roots) {
        calculateTotal(root);
      }

      /**
       * 6. Thêm category "Chưa phân loại" vào roots nếu có truyền startDate và endDate
       */
      const uncategorizedCategory: FinancialCategory_GetWithTransactionCount_Response =
        {
          id: 0,
          archived: false,
          color: "#4d4d4d",
          name: "Chưa phân loại",
          type: FINANCIAL_CATEGORY_TYPE.EXPENSE,
          monthlyBudget: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          icon: "FileQuestionMark",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          account: null as any,
          totalAmount: uncategorizedTotal,
        };
      roots.push(uncategorizedCategory);
    }

    const applyBudgetMetrics = (
      category: FinancialCategory_GetWithTransactionCount_Response,
    ) => {
      Object.assign(
        category,
        calculateBudgetMetrics(category as unknown as BudgetCategoryNode),
      );
      for (const child of category.children ?? []) {
        applyBudgetMetrics(
          child as FinancialCategory_GetWithTransactionCount_Response,
        );
      }
    };

    for (const root of roots) {
      applyBudgetMetrics(root);
    }

    return roots;
  }

  private async ensureBudgetMonth(
    accountId: number,
    month: string,
  ): Promise<void> {
    const currentMonth = dayjs().format("YYYY-MM");
    const nextMonth = dayjs().add(1, "month").format("YYYY-MM");
    if (month < currentMonth || month > nextMonth) return;

    await this.dataSource.query(
      `
      INSERT INTO "financial-category-budget" ("categoryId", "month", "amount", "createdAt", "updatedAt")
      SELECT category.id, $2, previous.amount, NOW(), NOW()
      FROM "financial-category" category
      LEFT JOIN LATERAL (
        SELECT budget.amount
        FROM "financial-category-budget" budget
        WHERE budget."categoryId" = category.id
          AND budget."month" < $2
        ORDER BY budget."month" DESC
        LIMIT 1
      ) previous ON TRUE
      WHERE category."accountId" = $1
        AND category.archived = false
        AND category."deletedAt" IS NULL
      ON CONFLICT ("categoryId", "month") DO NOTHING
      `,
      [accountId, month],
    );
  }

  async getBudgetSummary(month: string, user: JwtPayload) {
    await this.ensureBudgetMonth(user.sub, month);
    const categories = await this.financialCategoryRepository.find({
      where: { account: { id: user.sub }, parentId: IsNull(), archived: false },
    });
    const budgets = await this.financialCategoryBudgetRepository.find({
      where: {
        categoryId: In(categories.map((category) => category.id)),
        month,
      },
    });
    const budgetMap = new Map(
      budgets.map((budget) => [budget.categoryId, budget.amount]),
    );
    const incomePlan = await this.incomePlanRepository.findOne({
      where: { accountId: user.sub, month },
    });
    const monthStart = `${month}-01`;
    const monthEnd = dayjs(monthStart).endOf("month").format("YYYY-MM-DD");
    const actualTotals = await this.financialCategoryRepository.manager
      .createQueryBuilder(FinancialTransactionEntity, "transaction")
      .select(
        `COALESCE(SUM(CASE WHEN transaction.type = :incomeType THEN transaction.amount ELSE 0 END), 0)`,
        "actualIncome",
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN transaction.type = :expenseType THEN transaction.amount ELSE 0 END), 0)`,
        "totalSpent",
      )
      .where("transaction.accountId = :accountId", { accountId: user.sub })
      .andWhere(
        "transaction.transactionDate BETWEEN :monthStart AND :monthEnd",
        { monthStart, monthEnd },
      )
      .andWhere("transaction.deletedAt IS NULL")
      .setParameters({
        incomeType: FINANCIAL_TRANSACTION_TYPE.INCOME,
        expenseType: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
      })
      .getRawOne<{ actualIncome: string; totalSpent: string }>();
    const actualIncome = Number(actualTotals?.actualIncome ?? 0);
    const totalSpent = Number(actualTotals?.totalSpent ?? 0);
    const allocation = calculateIncomeAllocation(
      categories.map((category) => ({
        monthlyBudget: budgetMap.has(category.id)
          ? (budgetMap.get(category.id) ?? null)
          : null,
        totalAmount: 0,
        spendingNature: category.spendingNature,
      })),
      incomePlan?.expectedAmount ?? null,
    );

    return {
      month,
      expectedIncome: incomePlan?.expectedAmount ?? null,
      totalSpent,
      remainingToSpend: allocation.allocatedTotal - totalSpent,
      actualIncome,
      actualSurplus: actualIncome - totalSpent,
      ...allocation,
    };
  }

  async deleteCategory(
    categoryId: number,
    user: JwtPayload,
    transferToCategoryId: number | null,
  ): Promise<{ success: true }> {
    await this.dataSource.transaction(async (manager) => {
      const category = await manager.findOne(FinancialCategoryEntity, {
        where: { id: categoryId, account: { id: user.sub } },
      });
      if (!category) throw new Error("Category not found");

      if (transferToCategoryId !== null) {
        const target = await manager.findOne(FinancialCategoryEntity, {
          where: { id: transferToCategoryId, account: { id: user.sub } },
        });
        if (!target || target.id === categoryId) {
          throw new Error("Invalid transfer category");
        }
      }

      await manager
        .createQueryBuilder()
        .update(FinancialTransactionItemEntity)
        .set({ categoryId: transferToCategoryId ?? null })
        .where('"categoryId" = :categoryId', { categoryId })
        .execute();
      await manager.softRemove(category);
    });

    return { success: true };
  }

  async getTransactionCategory(
    categoryId: number,
    query: FinancialCategory_GetTransactionCategory_Request,
    user: JwtPayload,
  ): Promise<FinancialCategory_GetTransactionCategory_Response> {
    const { startDate, endDate } = query;

    // Chuẩn hoá range về Date, dùng chung cho cả 2 nhánh
    const startDateValue = dayjs(
      startDate ?? dayjs().startOf("month").toDate(),
    ).format("YYYY-MM-DD");
    const endDateValue = dayjs(
      endDate ??
        dayjs(startDateValue).add(1, "month").subtract(1, "day").toDate(),
    ).format("YYYY-MM-DD");

    const calcOvercome = <T extends { amount: number | string }>(
      items: T[],
    ) => {
      const total = items.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );
      const avg = items.length > 0 ? total / items.length : 0;
      return items.filter((item) => Number(item.amount || 0) > avg);
    };

    const itemQuery = () =>
      this.financialCategoryRepository.manager
        .createQueryBuilder(FinancialTransactionItemEntity, "item")
        .innerJoinAndSelect("item.transaction", "transaction")
        .where("item.deletedAt IS NULL")
        .andWhere("transaction.accountId = :accountId", { accountId: user.sub })
        .andWhere("transaction.transactionDate >= :start", {
          start: startDateValue,
        })
        .andWhere("transaction.transactionDate <= :end", {
          end: endDateValue,
        })
        .andWhere("transaction.type = :transactionType", {
          transactionType: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        })
        .andWhere("transaction.deletedAt IS NULL")
        .orderBy("transaction.transactionDate", "DESC");

    /**
     * TH1: Danh mục "Chưa phân loại" (categoryId = 0)
     */
    if (categoryId === 0) {
      const uncategorizedItems = await itemQuery()
        .andWhere("item.categoryId IS NULL")
        .getMany();

      const uncategorizedCategory: Partial<FinancialCategoryEntity> = {
        id: 0,
        archived: false,
        color: "#4d4d4d",
        name: "Chưa phân loại",
        type: FINANCIAL_CATEGORY_TYPE.EXPENSE,
        monthlyBudget: null,
        icon: "FileQuestionMark",
      };

      const mappedItems = uncategorizedItems.map((item) => ({
        ...item,
        category: uncategorizedCategory,
      }));

      return {
        parent: uncategorizedCategory as FinancialCategoryEntity,
        children: [],
        transactionItems: mappedItems,
        overcomeTransactionItems: calcOvercome(mappedItems),
      };
    }

    /**
     * TH2: Category bình thường (categoryId > 0)
     */

    // 1. Lấy toàn bộ category của account (giống điều kiện ở gets())
    const allCategories = await this.financialCategoryRepository.find({
      where: [
        {
          account: { id: user.sub },
          type: FINANCIAL_CATEGORY_TYPE.EXPENSE,
        },
        {
          account: { id: user.sub },
          type: IsNull(),
        },
      ],
      order: { createdAt: "ASC" },
    });

    const categoryById = new Map(allCategories.map((c) => [c.id, c]));
    const childrenByParent = new Map<number, FinancialCategoryEntity[]>();

    for (const c of allCategories) {
      if (c.parentId != null) {
        const list = childrenByParent.get(c.parentId) ?? [];
        list.push(c);
        childrenByParent.set(c.parentId, list);
      }
    }

    const category = categoryById.get(categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    // 2. Dựng cây con (mọi cấp) và gom id của cả subtree
    const categoryIds: number[] = [];

    const buildTree = (
      node: FinancialCategoryEntity,
    ): FinancialCategoryEntity => {
      categoryIds.push(node.id);
      const kids = childrenByParent.get(node.id) ?? [];
      return {
        ...node,
        children: kids.map(buildTree),
      } as FinancialCategoryEntity;
    };

    const { children: cleanedChildren = [], ...parentData } =
      buildTree(category);

    // 3. Lấy item của cả subtree, cùng điều kiện như gets()
    const rows = await itemQuery()
      .innerJoinAndSelect("item.category", "category")
      .andWhere("item.categoryId IN (:...categoryIds)", { categoryIds })
      .getMany();

    // 4. Giữ nguyên shape cũ: category rút gọn trong từng item
    const allTransactionItems = rows.map(({ category: cat, ...item }) => ({
      ...item,
      category: {
        id: cat?.id,
        name: cat?.name,
        color: cat?.color,
        icon: cat?.icon,
        type: cat?.type,
        monthlyBudget: cat?.monthlyBudget,
        archived: cat?.archived,
      },
    }));

    return {
      parent: parentData as FinancialCategoryEntity,
      children: cleanedChildren,
      transactionItems: allTransactionItems,
      overcomeTransactionItems: calcOvercome(allTransactionItems),
    };
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
