import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import dayjs from "dayjs";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FinancialTransactionItemEntity } from "../financial-transaction/_entities/financial-transaction-item.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialGoalEntity } from "../financial-goal/_entities/financial-goal.entity";
import { FinancialDebtEntity } from "../financial-debt/_entities/financial-debt.entity";
import {
  FINANCIAL_TRANSACTION_TYPE,
  FINANCIAL_TRANSACTION_STATUS,
} from "../financial-transaction/financial-transaction.enum";
import {
  GetFinancialDashboard_Request,
  FinancialDashboard_Response,
  CashFlowTimelinePoint,
  CategoryBreakdownItem,
  DashboardTimeFrame,
} from "./dto/financial-dashboard.dto";

@Injectable()
export class FinancialDashboardService {
  constructor(
    @InjectRepository(FinancialTransactionEntity)
    private readonly transactionRepository: Repository<FinancialTransactionEntity>,

    @InjectRepository(FinancialTransactionItemEntity)
    private readonly transactionItemRepository: Repository<FinancialTransactionItemEntity>,

    @InjectRepository(FinancialWalletEntity)
    private readonly walletRepository: Repository<FinancialWalletEntity>,

    @InjectRepository(FinancialGoalEntity)
    private readonly goalRepository: Repository<FinancialGoalEntity>,

    @InjectRepository(FinancialDebtEntity)
    private readonly debtRepository: Repository<FinancialDebtEntity>,
  ) {}

  async getDashboardSummary({
    query,
    user,
  }: {
    query: GetFinancialDashboard_Request;
    user: JwtPayload;
  }): Promise<FinancialDashboard_Response> {
    const accountId = user.sub;
    const { walletId, timeFrame = DashboardTimeFrame.MONTHLY } = query;

    // 1. Determine Date Range
    let startDate: Date;
    let endDate: Date;

    const now = dayjs();
    if (query.fromDate && query.toDate) {
      startDate = dayjs(query.fromDate).startOf("day").toDate();
      endDate = dayjs(query.toDate).endOf("day").toDate();
    } else if (timeFrame === DashboardTimeFrame.WEEKLY) {
      startDate = now.startOf("week").toDate();
      endDate = now.endOf("week").toDate();
    } else if (timeFrame === DashboardTimeFrame.YEARLY) {
      startDate = now.startOf("year").toDate();
      endDate = now.endOf("year").toDate();
    } else {
      // Default MONTHLY
      startDate = now.startOf("month").toDate();
      endDate = now.endOf("month").toDate();
    }

    // 2. Fetch Transactions in date range
    const qb = this.transactionRepository
      .createQueryBuilder("tx")
      .leftJoinAndSelect("tx.wallet", "wallet")
      .leftJoinAndSelect("tx.financialTransactionItems", "items")
      .leftJoinAndSelect("items.category", "category")
      .where("tx.accountId = :accountId", { accountId })
      .andWhere("tx.createdAt >= :startDate", { startDate })
      .andWhere("tx.createdAt <= :endDate", { endDate });

    if (walletId) {
      qb.andWhere("tx.walletId = :walletId", { walletId });
    }

    const transactions = await qb.getMany();

    // 3. Fetch All Wallets for Total Wallet Balance & Wallet list
    const wallets = await this.walletRepository.find({
      where: { account: { id: accountId } },
      order: { id: "ASC" },
    });

    const totalWalletBalance = wallets.reduce(
      (sum, w) => sum + Number(w.balance || 0),
      0,
    );

    // 4. Calculate Summary KPIs
    let totalIncome = 0;
    let totalExpense = 0;
    let pendingCount = 0;

    transactions.forEach((tx) => {
      if (tx.status === FINANCIAL_TRANSACTION_STATUS.PENDING) {
        pendingCount++;
      }
      const amount = Number(tx.amount || 0);
      if (tx.type === FINANCIAL_TRANSACTION_TYPE.INCOME) {
        totalIncome += amount;
      } else if (tx.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE) {
        totalExpense += amount;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0
        ? Math.max(
            0,
            Math.round(
              ((totalIncome - totalExpense) / totalIncome) * 100 * 10,
            ) / 10,
          )
        : 0;

    // 5. Cashflow Timeline
    const timelineMap = new Map<string, { income: number; expense: number }>();
    const isYearly = timeFrame === DashboardTimeFrame.YEARLY;

    // Pre-fill time range buckets so charts are continuous
    if (isYearly) {
      for (let i = 0; i < 12; i++) {
        const monthKey = dayjs(startDate).add(i, "month").format("YYYY-MM");
        timelineMap.set(monthKey, { income: 0, expense: 0 });
      }
    } else {
      const daysCount = dayjs(endDate).diff(dayjs(startDate), "day") + 1;
      for (let i = 0; i < Math.min(daysCount, 60); i++) {
        const dayKey = dayjs(startDate).add(i, "day").format("YYYY-MM-DD");
        timelineMap.set(dayKey, { income: 0, expense: 0 });
      }
    }

    transactions.forEach((tx) => {
      const key = dayjs(tx.createdAt).format(
        isYearly ? "YYYY-MM" : "YYYY-MM-DD",
      );
      const current = timelineMap.get(key) || { income: 0, expense: 0 };
      const amount = Number(tx.amount || 0);
      if (tx.type === FINANCIAL_TRANSACTION_TYPE.INCOME) {
        current.income += amount;
      } else if (tx.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE) {
        current.expense += amount;
      }
      timelineMap.set(key, current);
    });

    const cashFlowTimeline: CashFlowTimelinePoint[] = Array.from(
      timelineMap.entries(),
    ).map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));

    // 6. Category Breakdown (Expenses)
    const categoryMap = new Map<
      string,
      {
        categoryId: number | null;
        categoryName: string;
        categoryIcon?: string;
        categoryColor?: string;
        amount: number;
      }
    >();

    transactions
      .filter((tx) => tx.type === FINANCIAL_TRANSACTION_TYPE.EXPENSE)
      .forEach((tx) => {
        if (
          tx.financialTransactionItems &&
          tx.financialTransactionItems.length > 0
        ) {
          tx.financialTransactionItems.forEach((item) => {
            const catId = item.category?.id || null;
            const catName = item.category?.name || "Khác / Chưa phân loại";
            const key = catId ? String(catId) : "uncategorized";
            const current = categoryMap.get(key) || {
              categoryId: catId,
              categoryName: catName,
              categoryIcon: item.category?.icon,
              categoryColor: item.category?.color,
              amount: 0,
            };
            current.amount += Number(item.amount || 0);
            categoryMap.set(key, current);
          });
        } else {
          const key = "uncategorized";
          const current = categoryMap.get(key) || {
            categoryId: null,
            categoryName: "Chưa phân loại",
            amount: 0,
          };
          current.amount += Number(tx.amount || 0);
          categoryMap.set(key, current);
        }
      });

    const totalExpenseCategory = Array.from(categoryMap.values()).reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const categoryBreakdown: CategoryBreakdownItem[] = Array.from(
      categoryMap.values(),
    )
      .map((item) => ({
        ...item,
        percentage:
          totalExpenseCategory > 0
            ? Math.round((item.amount / totalExpenseCategory) * 100 * 10) / 10
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 7. Recent Transactions (Top 6)
    const recentTxList = await this.transactionRepository.find({
      where: { account: { id: accountId } },
      relations: [
        "wallet",
        "financialTransactionItems",
        "financialTransactionItems.category",
      ],
      order: { createdAt: "DESC" },
      take: 6,
    });

    const recentTransactions = recentTxList.map((tx) => ({
      id: tx.id,
      description: tx.description,
      merchant: tx.merchant,
      amount: Number(tx.amount || 0),
      type: tx.type,
      status: tx.status,
      createdAt: tx.createdAt,
      walletName: tx.wallet?.name,
      categoryName: tx.financialTransactionItems?.[0]?.category?.name,
    }));

    // 8. Goals Summary
    const activeGoals = await this.goalRepository.find({
      where: { accountId },
      take: 4,
    });

    const goalsSummary = activeGoals.map((g) => {
      const target = Number(g.targetAmount || 0);
      const current = Number(g.currentAmount || 0);
      const pct =
        target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      return {
        id: g.id,
        name: g.name,
        targetAmount: target,
        currentAmount: current,
        percentage: pct,
      };
    });

    // 9. Debts Summary
    const activeDebts = await this.debtRepository.find({
      where: { accountId },
      take: 4,
    });

    const debtsSummary = activeDebts.map((d) => {
      const orig = Number(d.originalAmount || 0);
      const out = Number(d.outstandingAmount || 0);
      return {
        id: d.id,
        name: d.namePerson || d.name,
        totalAmount: orig,
        paidAmount: Math.max(0, orig - out),
        type: d.direction || d.type,
      };
    });

    return {
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate,
        totalWalletBalance,
        pendingCount,
      },
      cashFlowTimeline,
      categoryBreakdown,
      wallets: wallets.map((w) => ({
        id: w.id,
        name: w.name,
        balance: Number(w.balance || 0),
        type: w.type,
        icon: w.icon,
        color: w.color,
      })),
      recentTransactions,
      goalsSummary,
      debtsSummary,
    };
  }
}
