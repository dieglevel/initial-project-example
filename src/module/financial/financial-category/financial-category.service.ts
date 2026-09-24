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
    const { amountMonth } = query;

    const hasAmountMonth = Boolean(amountMonth && dayjs(amountMonth).isValid());

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
     * Chỉ tính toán số tiền khi có amountMonth hợp lệ
     */
    if (hasAmountMonth) {
      const selectedDate = dayjs(amountMonth);
      const startDate = selectedDate.startOf("month").toDate();
      const endDate = selectedDate.add(1, "month").startOf("month").toDate();

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
          startDate,
          endDate,
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
          startDate,
          endDate,
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
     * 5. Aggregate totalAmount recursively (chỉ chạy nếu có amountMonth)
     */
    if (hasAmountMonth) {
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
       * 6. Thêm category "Chưa phân loại" vào roots nếu có truyền amountMonth
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
    const { amountMonth } = query;

    const selectedDate = dayjs(amountMonth);
    const startDate = selectedDate.startOf("month").toDate();
    const endDate = selectedDate.add(1, "month").startOf("month").toDate();

    /**
     * TH1: Xử lý danh mục "Chưa phân loại" (categoryId = 0)
     */
    if (categoryId === 0) {
      const uncategorizedItems = await this.financialCategoryRepository.manager
        .createQueryBuilder(FinancialTransactionItemEntity, "transactionItem")
        .innerJoinAndSelect("transactionItem.transaction", "transaction")
        .where('"transactionItem"."categoryId" IS NULL')
        .andWhere('"transactionItem"."deletedAt" IS NULL')
        .andWhere('"transaction"."accountId" = :accountId', {
          accountId: user.sub,
        })
        .andWhere('"transaction"."createdAt" >= :startDate', { startDate })
        .andWhere('"transaction"."createdAt" < :endDate', { endDate })
        .andWhere('"transaction"."type" = :transactionType', {
          transactionType: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        })
        .andWhere('"transaction"."deletedAt" IS NULL')
        .orderBy('"transaction"."createdAt"', "DESC")
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
      };
    }

    /**
     * TH2: Xử lý category bình thường (categoryId > 0)
     */
    const category = await this.financialCategoryRepository.findOne({
      where: {
        id: categoryId,
        account: {
          id: user.sub,
        },
      },
      relations: {
        transactionItems: true,
        children: {
          transactionItems: true,
          children: {
            transactionItems: true,
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const extractTransactionItems = (
      cat: FinancialCategoryEntity,
    ): (Omit<FinancialTransactionItemEntity, "category"> & {
      category: Partial<FinancialCategoryEntity>;
    })[] => {
      const items: (Omit<FinancialTransactionItemEntity, "category"> & {
        category: Partial<FinancialCategoryEntity>;
      })[] = [];

      // Lấy transaction items của category hiện tại
      if (cat.transactionItems && cat.transactionItems.length > 0) {
        cat.transactionItems.forEach((item) => {
          const itemDate = new Date(item.createdAt);

          if (itemDate >= startDate && itemDate < endDate) {
            items.push({
              ...item,
              category: {
                id: cat.id,
                name: cat.name,
                color: cat.color,
                icon: cat.icon,
                type: cat.type,
                monthlyBudget: cat.monthlyBudget,
                archived: cat.archived,
              },
            });
          }
        });
      }

      if (cat.children && cat.children.length > 0) {
        cat.children.forEach((child) => {
          items.push(...extractTransactionItems(child));
        });
      }

      return items;
    };

    const cleanChildrenTree = (
      nodes: FinancialCategoryEntity[],
    ): FinancialCategoryEntity[] => {
      return nodes.map((node) => {
        const { transactionItems, children, ...rest } = node;
        return {
          ...rest,
          ...(children && children.length > 0
            ? { children: cleanChildrenTree(children) }
            : { children: [] }),
        } as FinancialCategoryEntity;
      });
    };

    const { children = [], transactionItems = [], ...parentData } = category;

    const allTransactionItems = extractTransactionItems(category);

    const cleanedChildren = cleanChildrenTree(children);

    return {
      parent: parentData,
      children: cleanedChildren,
      transactionItems: allTransactionItems,
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
