import {
  calculateBudgetMetrics,
  calculateIncomeAllocation,
} from "./budget-calculator";

describe("budget calculator", () => {
  it("keeps a parent with no child limits distinct from zero", () => {
    expect(
      calculateBudgetMetrics({
        monthlyBudget: 100,
        totalAmount: 25,
        children: [],
      }),
    ).toMatchObject({
      remaining: 75,
      percent: 25,
      status: "ok",
      allocatedToChildren: 0,
    });
    expect(
      calculateBudgetMetrics({ monthlyBudget: 0, totalAmount: 0 }),
    ).toMatchObject({
      remaining: 0,
      percent: 0,
      status: "ok",
    });
    expect(
      calculateBudgetMetrics({ monthlyBudget: null, totalAmount: 25 }),
    ).toMatchObject({
      remaining: null,
      percent: null,
      status: "free",
    });
  });

  it("allows over-allocation and overspending without capping the percent", () => {
    expect(
      calculateBudgetMetrics({
        monthlyBudget: 100,
        totalAmount: 125,
        children: [
          { monthlyBudget: 75, totalAmount: 40 },
          { monthlyBudget: 50, totalAmount: 85 },
        ],
      }),
    ).toMatchObject({
      remaining: -25,
      percent: 125,
      status: "over",
      allocatedToChildren: 125,
      unallocated: -25,
      overAllocated: true,
    });
  });

  it("separates essential/free allocation and negative income remainder", () => {
    expect(
      calculateIncomeAllocation(
        [
          { monthlyBudget: 600, totalAmount: 0, spendingNature: "ESSENTIAL" },
          {
            monthlyBudget: 500,
            totalAmount: 0,
            spendingNature: "NON_ESSENTIAL",
          },
          { monthlyBudget: null, totalAmount: 0, spendingNature: "ESSENTIAL" },
        ],
        1000,
      ),
    ).toMatchObject({
      allocatedTotal: 1100,
      unallocatedIncome: -100,
      incomeWarning: true,
      essentialTotal: 600,
      freeTotal: 500,
    });
  });
});
