import {
  allocateFifo,
  normalizePersonName,
  splitPayment,
} from "./financial-debt.allocation";

describe("allocateFifo", () => {
  const debts = [
    { id: 3, startDate: "2026-03-01", outstandingAmount: 300 },
    { id: 1, startDate: "2026-01-01", outstandingAmount: 100 },
    { id: 2, startDate: "2026-01-01", outstandingAmount: 50.5 },
  ];

  it("pays the oldest debt first, tie-broken by id", () => {
    expect(allocateFifo(debts, 120)).toEqual([
      { id: 1, amount: 100 },
      { id: 2, amount: 20 },
    ]);
  });

  it("spreads across all debts when paying the full total", () => {
    expect(allocateFifo(debts, 450.5)).toEqual([
      { id: 1, amount: 100 },
      { id: 2, amount: 50.5 },
      { id: 3, amount: 300 },
    ]);
  });

  it("puts any amount above the total on the newest debt", () => {
    expect(allocateFifo(debts, 500)).toEqual([
      { id: 1, amount: 100 },
      { id: 2, amount: 50.5 },
      { id: 3, amount: 349.5 },
    ]);
  });

  it("skips debts with nothing outstanding", () => {
    expect(
      allocateFifo(
        [
          { id: 1, startDate: "2026-01-01", outstandingAmount: 0 },
          { id: 2, startDate: "2026-02-01", outstandingAmount: 10 },
        ],
        5,
      ),
    ).toEqual([{ id: 2, amount: 5 }]);
  });
});

describe("normalizePersonName", () => {
  it("ignores case and extra whitespace", () => {
    expect(normalizePersonName("  Nguyen   Van A ")).toBe(
      normalizePersonName("nguyen van a"),
    );
  });
});

describe("splitPayment", () => {
  it("returns no excess when paying within the outstanding amount", () => {
    expect(splitPayment(100, 40)).toEqual({ principal: 40, excess: 0 });
  });

  it("treats the amount above the outstanding as excess", () => {
    expect(splitPayment(100, 120.5)).toEqual({ principal: 100, excess: 20.5 });
  });
});
