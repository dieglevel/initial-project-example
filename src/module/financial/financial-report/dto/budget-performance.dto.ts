export class FinancialReport_BudgetCategoryPerformance_Response {
  categoryId: number;
  categoryName: string;
  budget: number;
  spent: number;
  remaining: number;
  exceeded: boolean;
  usagePercentage: number;
}

export class FinancialReport_BudgetPerformance_Response {
  from: Date;
  to: Date;
  totalBudget: number;
  totalSpent: number;
  totalSaved: number;
  overBudgetCount: number;
  complianceRate: number;
  categories: FinancialReport_BudgetCategoryPerformance_Response[];
}
