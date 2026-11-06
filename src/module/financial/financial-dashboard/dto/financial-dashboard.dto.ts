import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from "class-validator";

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
  @ApiPropertyOptional({
    description:
      "Lùi kỳ theo timeFrame: 0 = kỳ hiện tại, -1 = kỳ trước (tuần/tháng/năm), ...",
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(-240)
  @Max(0)
  @IsOptional()
  offset?: number = 0;
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
  deadline?: Date | string | null;
  status?: string;
  type?: string;
}

export class DebtSummaryItem {
  id: number;
  name: string;
  namePerson?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  /** INCOMING = cho vay (phải thu), OUTGOING = đi vay (phải trả) */
  direction: string;
  type: string;
  dueDate?: string | null;
  status?: string;
}

export class RecentTransactionItem {
  id: number;
  description?: string | null;
  merchant?: string | null;
  amount: number;
  type: string;
  status: string;
  createdAt: Date;
  transactionDate: string;
  walletName?: string;
  categoryName?: string;
}

export class FinancialDashboard_Response {
  period?: {
    startDate: string;
    endDate: string;
    cycleStartDate: number;
  };
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
