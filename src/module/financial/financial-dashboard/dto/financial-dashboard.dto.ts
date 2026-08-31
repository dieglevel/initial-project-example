import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNumber, IsOptional } from "class-validator";

export enum DashboardTimeFrame {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
  CUSTOM = "custom",
}

export class GetFinancialDashboard_Request {
  @ApiPropertyOptional({ description: "Lọc theo từ ngày (YYYY-MM-DD)" })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: "Lọc theo đến ngày (YYYY-MM-DD)" })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ description: "Lọc theo ID ví" })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  walletId?: number;

  @ApiPropertyOptional({
    enum: DashboardTimeFrame,
    default: DashboardTimeFrame.MONTHLY,
  })
  @IsEnum(DashboardTimeFrame)
  @IsOptional()
  timeFrame?: DashboardTimeFrame = DashboardTimeFrame.MONTHLY;
}

export class CashFlowTimelinePoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export class CategoryBreakdownItem {
  categoryId: number | null;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  amount: number;
  percentage: number;
}

export class WalletOverviewItem {
  id: number;
  name: string;
  balance: number;
  currency?: string;
  type?: string;
}

export class GoalSummaryItem {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
}

export class DebtSummaryItem {
  id: number;
  name: string;
  totalAmount: number;
  paidAmount: number;
  type: string;
}

export class RecentTransactionItem {
  id: number;
  description?: string | null;
  merchant?: string | null;
  amount: number;
  type: string;
  status: string;
  createdAt: Date;
  walletName?: string;
  categoryName?: string;
}

export class FinancialDashboard_Response {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    savingsRate: number;
    totalWalletBalance: number;
    pendingCount: number;
  };
  cashFlowTimeline: CashFlowTimelinePoint[];
  categoryBreakdown: CategoryBreakdownItem[];
  wallets: WalletOverviewItem[];
  recentTransactions: RecentTransactionItem[];
  goalsSummary: GoalSummaryItem[];
  debtsSummary: DebtSummaryItem[];
}
