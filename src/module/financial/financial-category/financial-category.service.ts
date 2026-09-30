import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { And, IsNull, LessThan, MoreThanOrEqual, Repository } from "typeorm";
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

@Injectable()
export class FinancialCategoryService extends BaseCrudService<FinancialCategoryEntity> {
  constructor(
    @InjectRepository(FinancialCategoryEntity)
    private readonly financialCategoryRepository: Repository<FinancialCategoryEntity>,
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

    const formattedStartDate = hasStartDate ? dayjs(startDate).toDate() : null;
    const formattedEndDate = hasEndDate ? dayjs(endDate).toDate() : null;

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
          AND "transaction"."createdAt" >= :startDate
          AND "transaction"."createdAt" < :endDate
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
          AND "transaction"."createdAt" >= :startDate
          AND "transaction"."createdAt" < :endDate
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

    return roots;
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
    ).toDate();
    const endDateValue = dayjs(
      endDate ?? dayjs(startDateValue).add(1, "month").toDate(),
    ).toDate();

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
        .andWhere("transaction.createdAt >= :start", { start: startDateValue })
        .andWhere("transaction.createdAt < :end", { end: endDateValue })
        .andWhere("transaction.type = :transactionType", {
          transactionType: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        })
        .andWhere("transaction.deletedAt IS NULL")
        .orderBy("transaction.createdAt", "DESC");

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
