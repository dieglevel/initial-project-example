import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import dayjs from "dayjs";
import type { JwtPayload } from "@/module/auth/payload.type";
import { FinancialTransactionEntity } from "../financial-transaction/_entities/financial-transaction.entity";
import { FinancialTransactionItemEntity } from "../financial-transaction/_entities/financial-transaction-item.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialGoalEntity } from "../financial-goal/_entities/financial-goal.entity";
import { FinancialDebtEntity } from "../financial-debt/_entities/financial-debt.entity";
import { FINANCIAL_DEBT_STATUS_ENUM } from "../financial-debt/financial-debt.enum";
import { FINANCIAL_GOAL_STATUS } from "../financial-goal/financial-goal.enum";
import { FinancialSettingEntity } from "../financial-setting/_entities/financial-setting.entity";
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

const VN_TZ = "Asia/Ho_Chi_Minh";
/** Số ngày trước hạn được coi là "sắp đến hạn" */
const DEBT_DUE_SOON_DAYS = 7;

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

    @InjectRepository(FinancialSettingEntity)
    private readonly settingRepository: Repository<FinancialSettingEntity>,
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

    // 0. Fetch user setting for cycleStartDate
    const userSetting = await this.settingRepository.findOne({
      where: { accountId },
    });
    const cycleStartDate = Math.max(
      1,
      Math.min(31, Number(userSetting?.cycleStartDate || 1)),
    );

    // 1. Determine Date Range
    let startDate: Date;
    let endDate: Date;

    const now = dayjs();
    // offset: 0 = kỳ hiện tại, -1 = kỳ trước, ... (đơn vị theo timeFrame)
    const offset = Math.min(0, Math.trunc(Number(query.offset ?? 0)));
    if (query.fromDate && query.toDate) {
      startDate = dayjs(query.fromDate).startOf("day").toDate();
      endDate = dayjs(query.toDate).endOf("day").toDate();
    } else if (timeFrame === DashboardTimeFrame.WEEKLY) {
      const ref = now.add(offset, "week");
      startDate = ref.startOf("week").toDate();
      endDate = ref.endOf("week").toDate();
    } else if (timeFrame === DashboardTimeFrame.YEARLY) {
      const ref = now.add(offset, "year");
      startDate = ref.startOf("year").toDate();
      endDate = ref.endOf("year").toDate();
    } else {
      // Default / MONTHLY calculated with cycleStartDate
      if (cycleStartDate === 1) {
        const ref = now.add(offset, "month");
        startDate = ref.startOf("month").toDate();
        endDate = ref.endOf("month").toDate();
      } else {
        // Ngày bắt đầu chu kỳ trong 1 tháng (vd 31 → 28/29 ở tháng 2)
        const cycleDayIn = (d: dayjs.Dayjs) =>
          Math.min(cycleStartDate, d.daysInMonth());

        // Tháng chứa ngày bắt đầu của chu kỳ hiện tại, rồi lùi theo offset
        const currentBase =
          now.date() < cycleDayIn(now) ? now.subtract(1, "month") : now;
        const baseDate = currentBase.startOf("month").add(offset, "month");

        startDate = baseDate.date(cycleDayIn(baseDate)).startOf("day").toDate();

        const nextMonth = baseDate.add(1, "month");
        endDate = nextMonth
          .date(cycleDayIn(nextMonth))
          .startOf("day")
          .subtract(1, "millisecond")
          .toDate();
      }
    }

    // 2. Fetch Transactions in date range
    const qb = this.transactionRepository
      .createQueryBuilder("tx")
      .leftJoinAndSelect("tx.wallet", "wallet")
      .leftJoinAndSelect("tx.financialTransactionItems", "items")
      .leftJoinAndSelect("items.category", "category")
      .where("tx.accountId = :accountId", { accountId })
      .andWhere("tx.transactionDate >= :startDate", {
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
      })
      .andWhere("tx.transactionDate <= :endDate", {
        endDate: dayjs(endDate).format("YYYY-MM-DD"),
      });

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
      const key = dayjs(tx.transactionDate).format(
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

    // 7. Recent Transactions (Top 6 by amount within cycle)
    const recentTxWhere: Record<string, any> = {
      account: { id: accountId },
      transactionDate: Between(
        dayjs(startDate).format("YYYY-MM-DD"),
        dayjs(endDate).format("YYYY-MM-DD"),
      ),
    };
    if (walletId) {
      recentTxWhere.wallet = { id: walletId };
    }

    const recentTxList = await this.transactionRepository.find({
      where: recentTxWhere,
      relations: [
        "wallet",
        "financialTransactionItems",
        "financialTransactionItems.category",
      ],
      order: { amount: "DESC", transactionDate: "DESC" },
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
      transactionDate: tx.transactionDate,
      walletName: tx.wallet?.name,
      categoryName: tx.financialTransactionItems?.[0]?.category?.name,
    }));

    // 8. Goals Summary
    // Chỉ mục tiêu đang chạy; gần deadline nhất trước, không có deadline xếp sau
    const activeGoals = await this.goalRepository.find({
      where: { accountId, status: FINANCIAL_GOAL_STATUS.ACTIVE },
      order: { deadline: { direction: "ASC", nulls: "LAST" }, id: "DESC" },
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
        deadline: g.deadline,
        status: g.status,
        type: g.type,
      };
    });

    // 9. Debts Summary — chỉ khoản đang mở (ACTIVE), tối đa 4.
    // Ưu tiên: quá hạn (lâu nhất trước) → sắp đến hạn (gần nhất trước) → mới tạo nhất.
    const openDebts = await this.debtRepository.find({
      where: { accountId, status: FINANCIAL_DEBT_STATUS_ENUM.ACTIVE },
    });
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: VN_TZ,
    }).format(new Date());
    const dueSoonLimit = dayjs(today)
      .add(DEBT_DUE_SOON_DAYS, "day")
      .format("YYYY-MM-DD");
    const debtPriority = (d: FinancialDebtEntity) => {
      if (d.dueDate && d.dueDate < today) return 0;
      if (d.dueDate && d.dueDate <= dueSoonLimit) return 1;
      return 2;
    };

    const debtsSummary = openDebts
      .sort((a, b) => {
        const pa = debtPriority(a);
        const pb = debtPriority(b);
        if (pa !== pb) return pa - pb;
        if (pa < 2) return String(a.dueDate).localeCompare(String(b.dueDate));
        return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
      })
      .slice(0, 4)
      .map((d) => {
        const orig = Number(d.originalAmount || 0);
        const out = Number(d.outstandingAmount || 0);
        return {
          id: d.id,
          name: d.name,
          namePerson: d.namePerson,
          totalAmount: orig,
          paidAmount: Math.max(0, orig - out),
          remainingAmount: out,
          direction: d.direction,
          type: d.type,
          dueDate: d.dueDate,
          status: d.status,
        };
      });

    return {
      period: {
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
        endDate: dayjs(endDate).format("YYYY-MM-DD"),
        cycleStartDate,
      },
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
