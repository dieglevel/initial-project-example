import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { Repository, Between } from "typeorm";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import {
  FINANCIAL_TRANSACTION_TYPE,
  FINANCIAL_TRANSACTION_STATUS,
} from "../financial-transaction/financial-transaction.enum";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FINANCIAL_WALLET_TYPE } from "../financial-wallet/financial-wallet.enum";
import { FinancialCategoryEntity } from "../financial-category/_entities/financial-category.entity";
import { FINANCIAL_CATEGORY_TYPE } from "../financial-category/financial-category.enum";
import {
  FINANCIAL_REPORT_PERIOD,
  type FinancialReport_Query_Request,
} from "./dto/query.dto";
import type { FinancialReport_CashFlow_Response } from "./dto/cash-flow.dto";
import type { FinancialReport_SpendingAnalysis_Response } from "./dto/spending-analysis.dto";
import type { FinancialReport_NetWorth_Response } from "./dto/net-worth.dto";
import type { FinancialReport_BudgetPerformance_Response } from "./dto/budget-performance.dto";

@Injectable()
export class FinancialReportService {
  constructor(
    @InjectRepository(FinancialTransactionEntity)
    private readonly transactionRepository: Repository<FinancialTransactionEntity>,

    @InjectRepository(FinancialWalletEntity)
    private readonly walletRepository: Repository<FinancialWalletEntity>,

    @InjectRepository(FinancialCategoryEntity)
    private readonly categoryRepository: Repository<FinancialCategoryEntity>,
  ) {}

  async getCashFlow(
    query: FinancialReport_Query_Request,
    user: JwtPayload,
  ): Promise<FinancialReport_CashFlow_Response> {
    const range = this.resolveRange(query);
    const groupMode = this.getGroupMode(query.period);

    // Lọc trực tiếp từ Database bằng Between để tối ưu RAM & Performance
    const transactions = await this.transactionRepository.find({
      where: {
        account: { id: user.sub },
        createdAt: Between(range.from, range.to),
      },
    });

    const seriesMap = new Map<string, { income: number; expense: number }>();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const transaction of transactions) {
      if (
        transaction.status === FINANCIAL_TRANSACTION_STATUS.FAILED ||
        transaction.type === FINANCIAL_TRANSACTION_TYPE.TRANSFER
      ) {
        continue;
      }

      const amount = Number(transaction.amount ?? 0);
      const dateVal = dayjs(transaction.createdAt);
      const key = dateVal.format(
        groupMode === "month" ? "YYYY-MM" : "YYYY-MM-DD",
      );

      const current = seriesMap.get(key) ?? { income: 0, expense: 0 };

      if (
        transaction.type === FINANCIAL_TRANSACTION_TYPE.INCOME ||
        transaction.type === FINANCIAL_TRANSACTION_TYPE.REFUND
      ) {
        current.income += amount;
        totalIncome += amount;
      } else if (transaction.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE) {
        current.expense += amount;
        totalExpense += amount;
      }

      seriesMap.set(key, current);
    }

    const series = Array.from(seriesMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([label, values]) => ({
        label,
        income: Number(values.income.toFixed(2)),
        expense: Number(values.expense.toFixed(2)),
        netCashFlow: Number((values.income - values.expense).toFixed(2)),
      }));

    const netCashFlow = totalIncome - totalExpense;

    return {
      from: range.from,
      to: range.to,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netCashFlow: Number(netCashFlow.toFixed(2)),
      trend:
        netCashFlow > 0 ? "positive" : netCashFlow < 0 ? "negative" : "neutral",
      series,
    };
  }

  async getSpendingAnalysis(
    query: FinancialReport_Query_Request,
    user: JwtPayload,
  ): Promise<FinancialReport_SpendingAnalysis_Response> {
    const range = this.resolveRange(query);
    const previousRange = this.getPreviousRange(range.from, range.to);

    // Fetch dữ liệu kỳ hiện tại trực tiếp từ DB kèm theo chi tiết Advance Transactions
    const currentExpenses = await this.transactionRepository.find({
      where: {
        account: { id: user.sub },
        type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        createdAt: Between(range.from, range.to),
      },
      relations: {
        financialAdvanceTransactions: {
          category: true,
        },
      },
    });

    // Fetch dữ liệu kỳ trước
    const previousExpenses = await this.transactionRepository.find({
      where: {
        account: { id: user.sub },
        type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        createdAt: Between(previousRange.from, previousRange.to),
      },
    });

    const categoryMap = new Map<
      string,
      { categoryId: number | null; categoryName: string; amount: number }
    >();

    let totalExpense = 0;

    for (const expense of currentExpenses) {
      if (expense.status === FINANCIAL_TRANSACTION_STATUS.FAILED) continue;

      // Xử lý nếu là Giao dịch nâng cao có các dòng chi tiết
      if (
        expense.financialAdvanceTransactions &&
        expense.financialAdvanceTransactions.length > 0
      ) {
        for (const subItem of expense.financialAdvanceTransactions) {
          const subAmount = Number(subItem.amount ?? 0);
          totalExpense += subAmount;

          const categoryId = subItem.category?.id ?? null;
          const categoryName = subItem.category?.name ?? "Uncategorized";
          const key =
            categoryId !== null ? String(categoryId) : "uncategorized";

          const current = categoryMap.get(key) ?? {
            categoryId,
            categoryName,
            amount: 0,
          };

          current.amount += subAmount;
          categoryMap.set(key, current);
        }
      } else {
        const amount = Number(expense.amount ?? 0);
        totalExpense += amount;

        const categoryId = expense.originalTransactionId ?? null;
        const categoryName = "Uncategorized";
        const key = categoryId !== null ? String(categoryId) : "uncategorized";

        const current = categoryMap.get(key) ?? {
          categoryId,
          categoryName,
          amount: 0,
        };

        current.amount += amount;
        categoryMap.set(key, current);
      }
    }

    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item) => ({
        ...item,
        amount: Number(item.amount.toFixed(2)),
        percentage:
          totalExpense > 0
            ? Number(((item.amount / totalExpense) * 100).toFixed(2))
            : 0,
      }));

    const previousPeriodExpense = previousExpenses
      .filter((t) => t.status !== FINANCIAL_TRANSACTION_STATUS.FAILED)
      .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

    const changePercentage =
      previousPeriodExpense > 0
        ? Number(
            (
              ((totalExpense - previousPeriodExpense) / previousPeriodExpense) *
              100
            ).toFixed(2),
          )
        : totalExpense > 0
          ? 100
          : 0;

    return {
      from: range.from,
      to: range.to,
      totalExpense: Number(totalExpense.toFixed(2)),
      topExpenses: categoryBreakdown.slice(0, 5),
      categoryBreakdown,
      previousPeriodExpense: Number(previousPeriodExpense.toFixed(2)),
      changePercentage,
    };
  }

  async getNetWorth(
    query: FinancialReport_Query_Request,
    user: JwtPayload,
  ): Promise<FinancialReport_NetWorth_Response> {
    const range = this.resolveRange(query);
    const groupMode = this.getGroupMode(query.period);

    const wallets = await this.walletRepository.find({
      where: {
        account: { id: user.sub },
      },
    });

    const assets = wallets
      .filter((wallet) => wallet.type !== FINANCIAL_WALLET_TYPE.CREDIT_CARD)
      .reduce((sum, wallet) => sum + Number(wallet.balance ?? 0), 0);

    const liabilities = wallets
      .filter((wallet) => wallet.type === FINANCIAL_WALLET_TYPE.CREDIT_CARD)
      .reduce((sum, wallet) => sum + Number(wallet.currentDebt ?? 0), 0);

    const netWorth = assets - liabilities;

    // Chỉ fetch giao dịch trong khoảng thời gian báo cáo
    const transactions = await this.transactionRepository.find({
      where: {
        account: { id: user.sub },
        createdAt: Between(range.from, range.to),
      },
    });

    const timelineMap = new Map<string, number>();

    for (const transaction of transactions) {
      if (
        transaction.type === FINANCIAL_TRANSACTION_TYPE.TRANSFER ||
        transaction.status === FINANCIAL_TRANSACTION_STATUS.FAILED
      ) {
        continue;
      }

      const key = dayjs(transaction.createdAt).format(
        groupMode === "month" ? "YYYY-MM" : "YYYY-MM-DD",
      );

      const signedAmount =
        transaction.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE
          ? -Number(transaction.amount ?? 0)
          : Number(transaction.amount ?? 0);

      timelineMap.set(key, (timelineMap.get(key) ?? 0) + signedAmount);
    }

    let runningNet = 0;
    const timeline = Array.from(timelineMap.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([label, delta]) => {
        runningNet += delta;
        return {
          label,
          assets: Number((assets + runningNet).toFixed(2)),
          liabilities: Number(liabilities.toFixed(2)),
          netWorth: Number((netWorth + runningNet).toFixed(2)),
        };
      });

    return {
      assets: Number(assets.toFixed(2)),
      liabilities: Number(liabilities.toFixed(2)),
      netWorth: Number(netWorth.toFixed(2)),
      timeline,
    };
  }

  async getBudgetPerformance(
    query: FinancialReport_Query_Request,
    user: JwtPayload,
  ): Promise<FinancialReport_BudgetPerformance_Response> {
    const range = this.resolveRange(query);

    const categories = await this.categoryRepository.find({
      where: {
        account: { id: user.sub },
        archived: false,
      },
    });

    const budgetCategories = categories.filter(
      (category) =>
        (!category.type || category.type === FINANCIAL_CATEGORY_TYPE.EXPENSE) &&
        Number(category.monthlyBudget ?? 0) > 0,
    );

    const transactions = await this.transactionRepository.find({
      where: {
        account: { id: user.sub },
        createdAt: Between(range.from, range.to),
        type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
      },
      relations: {
        financialAdvanceTransactions: true,
      },
    });

    const expenseMap = new Map<number, number>();

    for (const transaction of transactions) {
      if (transaction.status === FINANCIAL_TRANSACTION_STATUS.FAILED) {
        continue;
      }

      // Cộng dồn tiền từ advance transactions nếu có
      if (
        transaction.financialAdvanceTransactions &&
        transaction.financialAdvanceTransactions.length > 0
      ) {
        for (const subItem of transaction.financialAdvanceTransactions) {
          if (subItem.categoryId) {
            expenseMap.set(
              subItem.categoryId,
              (expenseMap.get(subItem.categoryId) ?? 0) +
                Number(subItem.amount ?? 0),
            );
          }
        }
      }
    }

    const categoryRows = budgetCategories.map((category) => {
      const budget = Number(category.monthlyBudget ?? 0);
      const spent = Number((expenseMap.get(category.id) ?? 0).toFixed(2));
      const remaining = Number((budget - spent).toFixed(2));
      const exceeded = spent > budget;
      const usagePercentage =
        budget > 0 ? Number(((spent / budget) * 100).toFixed(2)) : 0;

      return {
        categoryId: category.id,
        categoryName: category.name,
        budget,
        spent,
        remaining,
        exceeded,
        usagePercentage,
      };
    });

    const totalBudget = categoryRows.reduce(
      (sum, item) => sum + item.budget,
      0,
    );
    const totalSpent = categoryRows.reduce((sum, item) => sum + item.spent, 0);
    const totalSaved = totalBudget - totalSpent;
    const overBudgetCount = categoryRows.filter((item) => item.exceeded).length;
    const complianceRate =
      categoryRows.length > 0
        ? Number(
            (
              ((categoryRows.length - overBudgetCount) / categoryRows.length) *
              100
            ).toFixed(2),
          )
        : 100;

    return {
      from: range.from,
      to: range.to,
      totalBudget: Number(totalBudget.toFixed(2)),
      totalSpent: Number(totalSpent.toFixed(2)),
      totalSaved: Number(totalSaved.toFixed(2)),
      overBudgetCount,
      complianceRate,
      categories: categoryRows,
    };
  }

  private resolveRange(query: FinancialReport_Query_Request): {
    from: Date;
    to: Date;
  } {
    const period = query.period ?? FINANCIAL_REPORT_PERIOD.MONTH;
    const baseDate = dayjs(query.date ?? new Date());

    if (period === FINANCIAL_REPORT_PERIOD.CUSTOM && query.from && query.to) {
      return {
        from: dayjs(query.from).startOf("day").toDate(),
        to: dayjs(query.to).endOf("day").toDate(),
      };
    }

    if (period === FINANCIAL_REPORT_PERIOD.WEEK) {
      return {
        from: baseDate.startOf("week").toDate(),
        to: baseDate.endOf("week").toDate(),
      };
    }

    if (period === FINANCIAL_REPORT_PERIOD.QUARTER) {
      const year = baseDate.year();
      const month = baseDate.month();
      const quarterStartMonth = Math.floor(month / 3) * 3;

      return {
        from: dayjs(new Date(year, quarterStartMonth, 1))
          .startOf("day")
          .toDate(),
        to: dayjs(new Date(year, quarterStartMonth + 3, 0))
          .endOf("day")
          .toDate(),
      };
    }

    if (period === FINANCIAL_REPORT_PERIOD.YEAR) {
      return {
        from: baseDate.startOf("year").toDate(),
        to: baseDate.endOf("year").toDate(),
      };
    }

    return {
      from: baseDate.startOf("month").toDate(),
      to: baseDate.endOf("month").toDate(),
    };
  }

  private getPreviousRange(from: Date, to: Date): { from: Date; to: Date } {
    const durationMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - durationMs);

    return {
      from: prevFrom,
      to: prevTo,
    };
  }

  private getGroupMode(period?: FINANCIAL_REPORT_PERIOD): "day" | "month" {
    if (period === FINANCIAL_REPORT_PERIOD.YEAR) {
      return "month";
    }

    return "day";
  }
}
