import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { DataSource, Repository } from "typeorm";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialCategoryEntity } from "./_entities/financial-category.entity";
import { FinancialCategoryBudgetEntity } from "./_entities/financial-category-budget.entity";
import type { FinancialCategory_Budget_Request } from "./dto/budget.dto";

@Injectable()
export class FinancialCategoryBudgetService {
  constructor(
    @InjectRepository(FinancialCategoryBudgetEntity)
    private readonly budgetRepository: Repository<FinancialCategoryBudgetEntity>,
    @InjectRepository(FinancialCategoryEntity)
    private readonly categoryRepository: Repository<FinancialCategoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async upsert(
    categoryId: number,
    dto: FinancialCategory_Budget_Request,
    user: JwtPayload,
  ): Promise<FinancialCategoryBudgetEntity> {
    this.validateMonth(dto.month);
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, account: { id: user.sub } },
    });
    if (!category) throw new NotFoundException("Category not found");

    await this.budgetRepository.upsert(
      {
        categoryId,
        month: dto.month,
        amount: FinancialCategoryBudgetService.normalizeAmount(dto.amount),
      },
      { conflictPaths: ["categoryId", "month"] },
    );
    return this.budgetRepository.findOneByOrFail({
      categoryId,
      month: dto.month,
    });
  }

  async ensureMonth(accountId: number, month: string): Promise<void> {
    this.validateMonth(month);
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

  private validateMonth(month: string): void {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new BadRequestException("month must use YYYY-MM format");
    }
  }

  static normalizeAmount(amount: number | null): number | null {
    return amount === null ? null : Number(amount);
  }

  static nearestBudgetValue(
    budgets: Array<{ month: string; amount: number | null }>,
  ): number | null {
    return (
      budgets.sort((a, b) => b.month.localeCompare(a.month))[0]?.amount ?? null
    );
  }
}
