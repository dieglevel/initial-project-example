import { FinancialCategoryBudgetService } from "./financial-category-budget.service";

describe("FinancialCategoryBudgetService", () => {
  it("preserves null and zero as distinct budget values", () => {
    expect(FinancialCategoryBudgetService.normalizeAmount(null)).toBeNull();
    expect(FinancialCategoryBudgetService.normalizeAmount(0)).toBe(0);
  });

  it("copies the nearest previous value, including null and zero", () => {
    expect(
      FinancialCategoryBudgetService.nearestBudgetValue([
        { month: "2026-09", amount: 0 },
        { month: "2026-10", amount: null },
      ]),
    ).toBeNull();
    expect(
      FinancialCategoryBudgetService.nearestBudgetValue([
        { month: "2026-08", amount: 100 },
        { month: "2026-10", amount: 0 },
      ]),
    ).toBe(0);
  });
});
