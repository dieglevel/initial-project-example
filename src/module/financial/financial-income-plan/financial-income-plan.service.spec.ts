import { FinancialIncomePlanService } from "./financial-income-plan.service";

describe("FinancialIncomePlanService", () => {
  it("returns null for a month without a plan", async () => {
    const repository = { findOne: jest.fn().mockResolvedValue(null) } as never;
    const service = new FinancialIncomePlanService(repository);
    await expect(
      service.get("2026-11", { sub: 7 } as never),
    ).resolves.toBeNull();
  });

  it("upserts the expected amount for the account and month", async () => {
    const row = { accountId: 7, month: "2026-11", expectedAmount: 1200 };
    const repository = {
      upsert: jest.fn().mockResolvedValue(undefined),
      findOneByOrFail: jest.fn().mockResolvedValue(row),
    };
    const service = new FinancialIncomePlanService(repository as never);
    await expect(
      service.upsert("2026-11", { expectedAmount: 1200 }, { sub: 7 } as never),
    ).resolves.toEqual(row);
    expect(repository.upsert).toHaveBeenCalledWith(
      { accountId: 7, month: "2026-11", expectedAmount: 1200 },
      { conflictPaths: ["accountId", "month"] },
    );
  });
});
