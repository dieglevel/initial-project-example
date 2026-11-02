export type BudgetStatus = "ok" | "warn" | "danger" | "over" | "free";

export interface BudgetCategoryNode {
  monthlyBudget: number | null;
  totalAmount: number;
  spendingNature?: string | null;
  children?: BudgetCategoryNode[];
}

export interface BudgetMetrics {
  remaining: number | null;
  percent: number | null;
  status: BudgetStatus;
  allocatedToChildren: number;
  unallocated: number | null;
  overAllocated: boolean;
}

export function calculateBudgetMetrics(
  category: BudgetCategoryNode,
): BudgetMetrics {
  const limit = category.monthlyBudget;
  const spent = Number(category.totalAmount || 0);
  const allocatedToChildren = (category.children ?? []).reduce(
    (sum, child) =>
      sum + (child.monthlyBudget === null ? 0 : Number(child.monthlyBudget)),
    0,
  );

  if (limit === null) {
    return {
      remaining: null,
      percent: null,
      status: "free",
      allocatedToChildren,
      unallocated: null,
      overAllocated: false,
    };
  }

  const remaining = limit - spent;
  const percent =
    limit === 0 ? (spent > 0 ? Infinity : 0) : (spent / limit) * 100;
  const status =
    limit === 0 && spent > 0
      ? "over"
      : percent >= 100
        ? "over"
        : percent >= 90
          ? "danger"
          : percent >= 70
            ? "warn"
            : "ok";

  return {
    remaining,
    percent,
    status,
    allocatedToChildren,
    unallocated: limit - allocatedToChildren,
    overAllocated: allocatedToChildren > limit,
  };
}

export interface IncomeAllocation {
  allocatedTotal: number;
  unallocatedIncome: number | null;
  incomeWarning: boolean;
  essentialTotal: number;
  essentialPercent: number | null;
  freeTotal: number;
  freePercent: number | null;
}

export function calculateIncomeAllocation(
  categories: Array<BudgetCategoryNode>,
  expectedIncome: number | null,
): IncomeAllocation {
  const limited = categories.filter(
    (category) => category.monthlyBudget !== null,
  );
  const allocatedTotal = limited.reduce(
    (sum, category) => sum + Number(category.monthlyBudget),
    0,
  );
  const essentialTotal = limited
    .filter((category) => category.spendingNature === "ESSENTIAL")
    .reduce((sum, category) => sum + Number(category.monthlyBudget), 0);
  const freeTotal = allocatedTotal - essentialTotal;

  return {
    allocatedTotal,
    unallocatedIncome:
      expectedIncome === null ? null : expectedIncome - allocatedTotal,
    incomeWarning:
      expectedIncome !== null && expectedIncome - allocatedTotal < 0,
    essentialTotal,
    essentialPercent:
      expectedIncome && expectedIncome > 0
        ? (essentialTotal / expectedIncome) * 100
        : null,
    freeTotal,
    freePercent:
      expectedIncome && expectedIncome > 0
        ? (freeTotal / expectedIncome) * 100
        : null,
  };
}
