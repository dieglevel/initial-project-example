import { BadRequestException } from "@nestjs/common";
import { FinancialGoalService } from "./financial-goal.service";
import { FinancialGoalEntity } from "./_entities/financial-goal.entity";
import { FinancialGoalHistoryEntity } from "./financial-goal-history/_entities/financial-goal-history.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import {
  FINANCIAL_GOAL_SAVING_MODE,
  FINANCIAL_GOAL_STATUS,
} from "./financial-goal.enum";
import {
  FINANCIAL_GOAL_HISTORY_STATUS,
  FINANCIAL_GOAL_HISTORY_TYPE,
} from "./financial-goal-history/financial-goal-history.enum";

type Goal = Partial<FinancialGoalEntity> & { id: number; accountId: number };
type Wallet = { id: number; accountId: number; balance: number };

const ACCOUNT = 7;

const makeGoal = (over: Partial<Goal> = {}): Goal => ({
  id: 1,
  accountId: ACCOUNT,
  name: "Laptop",
  targetAmount: 1000,
  currentAmount: 0,
  status: FINANCIAL_GOAL_STATUS.ACTIVE,
  savingMode: FINANCIAL_GOAL_SAVING_MODE.MANUAL,
  isLocked: false,
  walletId: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

/**
 * Manager giả lập trong bộ nhớ: đủ cho các truy vấn service dùng
 * (findOne / findOneOrFail / save / create / update / exists).
 */
const setup = (goals: Goal[], wallets: Wallet[] = []) => {
  const saved: Array<Partial<FinancialGoalHistoryEntity>> = [];
  const existingSystem = new Set<string>();

  const findGoal = (where: { id: number; accountId?: number }) =>
    goals.find(
      (g) =>
        g.id === where.id &&
        (where.accountId === undefined || g.accountId === where.accountId),
    ) ?? null;

  const findWallet = (where: { id: number; account?: { id: number } }) =>
    wallets.find(
      (w) =>
        w.id === where.id &&
        (where.account === undefined || w.accountId === where.account.id),
    ) ?? null;

  const manager = {
    findOne: jest.fn((entity: unknown, opts: { where: never }) => {
      if (entity === FinancialGoalEntity)
        return Promise.resolve(findGoal(opts.where));
      if (entity === FinancialWalletEntity)
        return Promise.resolve(findWallet(opts.where));
      return Promise.resolve(null);
    }),
    findOneOrFail: jest.fn((_entity: unknown, opts: { where: never }) =>
      Promise.resolve(findWallet(opts.where)),
    ),
    save: jest.fn((x: object) => {
      if (!("targetAmount" in x) && !("balance" in x)) saved.push(x);
      return Promise.resolve(x);
    }),
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    update: jest.fn(() => Promise.resolve()),
    exists: jest.fn((_e: unknown, opts: { where: { goalId: number } }) =>
      Promise.resolve(existingSystem.has(String(opts.where.goalId))),
    ),
  };

  const goalRepository = {
    findOne: jest.fn((opts: { where: never }) =>
      Promise.resolve(findGoal(opts.where)),
    ),
    find: jest.fn(() => Promise.resolve(goals)),
    save: jest.fn((x: object) => Promise.resolve(x)),
    softDelete: jest.fn(() => Promise.resolve({ affected: 1 })),
  };
  const historyRepository = {
    find: jest.fn(() =>
      Promise.resolve([...existingSystem].map((id) => ({ goalId: +id }))),
    ),
  };
  const walletRepository = {
    findOne: jest.fn((opts: { where: never }) =>
      Promise.resolve(findWallet(opts.where)),
    ),
  };
  const dataSource = {
    transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
  };

  const service = new FinancialGoalService(
    goalRepository as never,
    historyRepository as never,
    walletRepository as never,
    dataSource as never,
  );
  return { service, saved, existingSystem, goalRepository };
};

describe("FinancialGoalService", () => {
  describe("addManualContribution", () => {
    it("rejects an amount larger than what is left", async () => {
      const { service } = setup([makeGoal({ currentAmount: 900 })]);
      await expect(
        service.addManualContribution(1, ACCOUNT, { amount: 200 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("deducts the wallet and completes the goal when the target is reached", async () => {
      const goal = makeGoal({ currentAmount: 600 });
      const wallet = { id: 3, accountId: ACCOUNT, balance: 1000 };
      const { service, saved } = setup([goal], [wallet]);

      const res = await service.addManualContribution(1, ACCOUNT, {
        amount: 400,
        walletId: 3,
      });

      expect(wallet.balance).toBe(600);
      expect(goal.currentAmount).toBe(1000);
      expect(goal.status).toBe(FINANCIAL_GOAL_STATUS.COMPLETED);
      expect(res.isCompleted).toBe(true);
      expect(saved[0]).toMatchObject({
        type: FINANCIAL_GOAL_HISTORY_TYPE.CONTRIBUTION,
        amount: 400,
        walletId: 3,
      });
    });

    it("does not touch any wallet when walletId is omitted", async () => {
      const goal = makeGoal();
      const wallet = { id: 3, accountId: ACCOUNT, balance: 50 };
      const { service } = setup([goal], [wallet]);
      await service.addManualContribution(1, ACCOUNT, { amount: 300 });
      expect(wallet.balance).toBe(50);
      expect(goal.currentAmount).toBe(300);
    });

    it("rejects a paused goal", async () => {
      const { service } = setup([
        makeGoal({ status: FINANCIAL_GOAL_STATUS.INACTIVE }),
      ]);
      await expect(
        service.addManualContribution(1, ACCOUNT, { amount: 10 }),
      ).rejects.toThrow("Goal is not active");
    });
  });

  describe("withdraw", () => {
    it("is blocked while the goal is locked", async () => {
      const { service } = setup([
        makeGoal({ currentAmount: 500, isLocked: true }),
      ]);
      await expect(
        service.withdraw(1, ACCOUNT, { amount: 100 }),
      ).rejects.toThrow("locked");
    });

    it("credits the wallet and reopens a completed goal", async () => {
      const goal = makeGoal({
        currentAmount: 1000,
        status: FINANCIAL_GOAL_STATUS.COMPLETED,
      });
      const wallet = { id: 3, accountId: ACCOUNT, balance: 0 };
      const { service, saved } = setup([goal], [wallet]);

      await service.withdraw(1, ACCOUNT, { amount: 250, walletId: 3 });

      expect(wallet.balance).toBe(250);
      expect(goal.currentAmount).toBe(750);
      expect(goal.status).toBe(FINANCIAL_GOAL_STATUS.ACTIVE);
      expect(saved[0]).toMatchObject({
        type: FINANCIAL_GOAL_HISTORY_TYPE.WITHDRAWAL,
        amount: 250,
      });
    });
  });

  describe("cancelGoal", () => {
    it("refunds the saved amount into the chosen wallet", async () => {
      const goal = makeGoal({ currentAmount: 300 });
      const wallet = { id: 3, accountId: ACCOUNT, balance: 0 };
      const { service } = setup([goal], [wallet]);

      await service.cancelGoal(1, ACCOUNT, { refundWalletId: 3 });

      expect(wallet.balance).toBe(300);
      expect(goal.currentAmount).toBe(0);
      expect(goal.status).toBe(FINANCIAL_GOAL_STATUS.CANCELLED);
    });

    it("refuses a refund while locked", async () => {
      const { service } = setup(
        [makeGoal({ currentAmount: 300, isLocked: true })],
        [{ id: 3, accountId: ACCOUNT, balance: 0 }],
      );
      await expect(
        service.cancelGoal(1, ACCOUNT, { refundWalletId: 3 }),
      ).rejects.toThrow("locked");
    });
  });

  describe("updateForUser", () => {
    it("ignores status/currentAmount and re-evaluates completion", async () => {
      const goal = makeGoal({ currentAmount: 800 });
      const { service } = setup([goal]);

      await service.updateForUser(1, ACCOUNT, {
        targetAmount: 800,
        status: FINANCIAL_GOAL_STATUS.CANCELLED,
        currentAmount: 0,
      } as never);

      expect(goal.currentAmount).toBe(800);
      expect(goal.status).toBe(FINANCIAL_GOAL_STATUS.COMPLETED);
    });

    it("returns 404 for another account's goal", async () => {
      const { service } = setup([makeGoal({ accountId: 99 })]);
      await expect(
        service.updateForUser(1, ACCOUNT, { name: "x" }),
      ).rejects.toThrow("not found");
    });
  });

  describe("runAutoContributions", () => {
    const autoGoal = (over: Partial<Goal> = {}) =>
      makeGoal({
        savingMode: FINANCIAL_GOAL_SAVING_MODE.AUTO,
        autoContributionAmount: 200,
        autoContributionDay: 5,
        ...over,
      });

    it("does nothing before the contribution day", async () => {
      const { service, saved } = setup([autoGoal()]);
      const res = await service.runAutoContributions("2026-11-04");
      expect(res).toEqual({ completed: 0, pending: 0, skipped: 0, failed: 0 });
      expect(saved).toHaveLength(0);
    });

    it("debits the default wallet when it has enough money", async () => {
      const goal = autoGoal({ walletId: 3 });
      const wallet = { id: 3, accountId: ACCOUNT, balance: 500 };
      const { service, saved } = setup([goal], [wallet]);

      const res = await service.runAutoContributions("2026-11-06");

      expect(res.completed).toBe(1);
      expect(wallet.balance).toBe(300);
      expect(goal.currentAmount).toBe(200);
      expect(saved[0]).toMatchObject({
        period: "2026-11",
        status: FINANCIAL_GOAL_HISTORY_STATUS.COMPLETED,
      });
    });

    it("creates a pending entry when the wallet is short", async () => {
      const goal = autoGoal({ walletId: 3 });
      const wallet = { id: 3, accountId: ACCOUNT, balance: 50 };
      const { service, saved } = setup([goal], [wallet]);

      const res = await service.runAutoContributions("2026-11-06");

      expect(res.pending).toBe(1);
      expect(wallet.balance).toBe(50);
      expect(goal.currentAmount).toBe(0);
      expect(saved[0]).toMatchObject({
        status: FINANCIAL_GOAL_HISTORY_STATUS.PENDING,
        plannedAmount: 200,
        amount: 0,
      });
    });

    it("plans only what is left on the last month", async () => {
      const { service, saved } = setup([autoGoal({ currentAmount: 950 })]);
      await service.runAutoContributions("2026-11-06");
      expect(saved[0]).toMatchObject({ plannedAmount: 50 });
    });

    it("runs day 31 on the last day of a 30-day month", async () => {
      const { service } = setup([autoGoal({ autoContributionDay: 31 })]);
      const res = await service.runAutoContributions("2026-11-30");
      expect(res.pending).toBe(1);
    });

    it("skips goals already contributed this period", async () => {
      const { service, existingSystem } = setup([autoGoal()]);
      existingSystem.add("1");
      const res = await service.runAutoContributions("2026-11-06");
      expect(res.skipped).toBe(1);
    });

    it("does not back-fill a period whose due day is before the goal was created", async () => {
      const { service, saved } = setup([
        autoGoal({ createdAt: new Date("2026-11-20T05:00:00Z") }),
      ]);
      const res = await service.runAutoContributions("2026-11-21");
      expect(res.pending + res.completed).toBe(0);
      expect(saved).toHaveLength(0);
    });
  });
});
