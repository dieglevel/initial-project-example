export class FinancialReport_SpendingCategory_Response {
  categoryId: number | null;
  categoryName: string;
  amount: number;
  percentage: number;
}

export class FinancialReport_SpendingAnalysis_Response {
  from: Date;
  to: Date;
  totalExpense: number;
  topExpenses: FinancialReport_SpendingCategory_Response[];
  categoryBreakdown: FinancialReport_SpendingCategory_Response[];
  previousPeriodExpense: number;
  changePercentage: number;
}
