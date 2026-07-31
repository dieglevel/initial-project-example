export class FinancialReport_CashFlowSeriesItem_Response {
  label: string;
  income: number;
  expense: number;
  netCashFlow: number;
}

export class FinancialReport_CashFlow_Response {
  from: Date;
  to: Date;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  trend: "positive" | "negative" | "neutral";
  series: FinancialReport_CashFlowSeriesItem_Response[];
}
