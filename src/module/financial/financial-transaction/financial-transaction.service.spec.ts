import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { DataSource } from "typeorm";

import { FinancialTransactionService } from "./financial-transaction.service";
import { FinancialTransactionEntity } from "./_entities/financial-transaction.entity";
import { FinancialWalletEntity } from "../financial-wallet/_entities/financial-wallet.entity";
import { FinancialTransactionItemEntity } from "./_entities/financial-transaction-item.entity";
import {
  FINANCIAL_TRANSACTION_STATUS,
  FINANCIAL_TRANSACTION_TYPE,
} from "./financial-transaction.enum";
import type { JwtPayload } from "@/module/auth/payload.type";

type Wallet = { id: number; balance: number };
type Transaction = {
  id: number;
  amount: number;
  type: FINANCIAL_TRANSACTION_TYPE;
  status: FINANCIAL_TRANSACTION_STATUS;
  wallet: Wallet;
  account?: { id: number };
  financialTransactionItems?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};
type Manager = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
};
type QueryBuilder = {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getMany: jest.Mock;
  getManyAndCount: jest.Mock;
  getOne: jest.Mock;
};

const user: JwtPayload = { sub: 7, email: "test@example.com" } as JwtPayload;
const completed = FINANCIAL_TRANSACTION_STATUS.COMPLETED;
const pending = FINANCIAL_TRANSACTION_STATUS.PENDING;

const wallet = (id: number, balance = 1_000): Wallet => ({ id, balance });

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 11,
  amount: 200,
  type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
  status: completed,
  wallet: wallet(1, 800),
  ...overrides,
});

const createManager = (): Manager => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((_entity: unknown, values: object) => ({ ...values })),
  save: jest.fn(async (value: unknown) => value),
  delete: jest.fn(async () => undefined),
  remove: jest.fn(async () => undefined),
});

const createQueryBuilder = (
  many: Transaction[] = [],
  paged: [Transaction[], number] = [[], 0],
  one: Transaction | null = null,
): QueryBuilder => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(many),
  getManyAndCount: jest.fn().mockResolvedValue(paged),
  getOne: jest.fn().mockResolvedValue(one),
});

describe("FinancialTransactionService", () => {
  let service: FinancialTransactionService;
  let transactionRepository: { createQueryBuilder: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let manager: Manager;

  beforeEach(async () => {
    manager = createManager();
    dataSource = {
      transaction: jest.fn((callback: (value: Manager) => unknown) =>
        callback(manager),
      ),
    };
    transactionRepository = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialTransactionService,
        {
          provide: getRepositoryToken(FinancialTransactionEntity),
          useValue: transactionRepository,
        },
        {
          provide: getRepositoryToken(FinancialWalletEntity),
          useValue: {},
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(FinancialTransactionService);
    jest.clearAllMocks();
  });

  describe("createOverride", () => {
    const runCreate = async (
      type: FINANCIAL_TRANSACTION_TYPE,
      initialBalance = 1_000,
    ) => {
      const source = wallet(1, initialBalance);
      manager.findOne.mockResolvedValueOnce(source);
      manager.save.mockImplementation(async (value: unknown) => {
        if (
          value &&
          typeof value === "object" &&
          "type" in value &&
          "amount" in value &&
          !("balance" in value)
        ) {
          return { id: 20, ...(value as object) };
        }
        return value;
      });
      const result = await service.createOverride(
        { walletId: 1, amount: 200, type } as never,
        user,
      );
      return { result, source };
    };

    it.each([
      [FINANCIAL_TRANSACTION_TYPE.EXPENSE, 800],
      [FINANCIAL_TRANSACTION_TYPE.INCOME, 1_200],
      [FINANCIAL_TRANSACTION_TYPE.REFUND, 1_200],
      [FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT, 1_200],
    ])("applies %s balance behavior", async (type, expectedBalance) => {
      // Arrange
      // Act
      const { source, result } = await runCreate(type);

      // Assert
      expect(source.balance).toBe(expectedBalance);
      expect(result.status).toBe(completed);
      expect(result.wallet).toBe(source);
      expect(result.account).toEqual({ id: user.sub });
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("creates a transfer and its optional fee expense", async () => {
      // Arrange
      const source = wallet(1, 1_000);
      const destination = wallet(2, 100);
      manager.findOne
        .mockResolvedValueOnce(source)
        .mockResolvedValueOnce(destination);

      // Act
      await service.createOverride(
        {
          walletId: 1,
          toWalletId: 2,
          amount: 300,
          transferFee: 25,
          type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
        } as never,
        user,
      );

      // Assert
      expect(source.balance).toBe(675);
      expect(destination.balance).toBe(400);
      expect(manager.create).toHaveBeenCalledWith(
        FinancialTransactionEntity,
        expect.objectContaining({
          description: "Transfer Fee",
          amount: 25,
          type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
          status: completed,
          account: { id: user.sub },
        }),
      );
      expect(manager.findOne).toHaveBeenNthCalledWith(
        2,
        FinancialWalletEntity,
        {
          where: { id: 2 },
          lock: { mode: "pessimistic_write" },
        },
      );
    });

    it.each([
      [
        "missing destination",
        {},
        "Destination wallet (toWalletId) is required",
      ],
      ["same wallet", { toWalletId: 1 }, "Cannot transfer to the same wallet"],
    ])("rejects transfer with %s", async (_label, extra, message) => {
      // Arrange
      manager.findOne.mockResolvedValueOnce(wallet(1, 1_000));

      // Act and Assert
      await expect(
        service.createOverride(
          {
            walletId: 1,
            amount: 100,
            type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
            ...extra,
          } as never,
          user,
        ),
      ).rejects.toThrow(message);
    });

    it("rejects insufficient expense, transfer, missing wallet and negative fee", async () => {
      // Arrange / Act / Assert
      manager.findOne.mockResolvedValueOnce(wallet(1, 50));
      await expect(
        service.createOverride(
          {
            walletId: 1,
            amount: 100,
            type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
          } as never,
          user,
        ),
      ).rejects.toThrow(BadRequestException);

      manager.findOne.mockResolvedValueOnce(wallet(1, 100));
      await expect(
        service.createOverride(
          {
            walletId: 1,
            toWalletId: 2,
            amount: 90,
            transferFee: 20,
            type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
          } as never,
          user,
        ),
      ).rejects.toThrow("Insufficient wallet balance for transfer");

      manager.findOne.mockResolvedValueOnce(null);
      await expect(
        service.createOverride(
          {
            walletId: 1,
            amount: 1,
            type: FINANCIAL_TRANSACTION_TYPE.INCOME,
          } as never,
          user,
        ),
      ).rejects.toThrow(NotFoundException);

      manager.findOne.mockResolvedValueOnce(wallet(1));
      await expect(
        service.createOverride(
          {
            walletId: 1,
            amount: 1,
            transferFee: -1,
            type: FINANCIAL_TRANSACTION_TYPE.INCOME,
          } as never,
          user,
        ),
      ).rejects.toThrow(BadRequestException);

      manager.findOne.mockResolvedValueOnce(wallet(1));
      await expect(
        service.createOverride(
          { walletId: 1, amount: 1, type: "INVALID" as never },
          user,
        ),
      ).rejects.toThrow("Invalid transaction type");
    });

    it("stores custom date, explicit status, items, and skips items when absent", async () => {
      // Arrange
      const source = wallet(1);
      manager.findOne.mockResolvedValue(source);
      manager.save.mockImplementation(async (value: unknown) =>
        value &&
        typeof value === "object" &&
        "type" in value &&
        "amount" in value
          ? { id: 21, ...(value as object) }
          : value,
      );
      const date = "2026-01-02T03:04:05.000Z";

      // Act
      const result = await service.createOverride(
        {
          walletId: 1,
          amount: 120,
          type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
          status: pending,
          date: date as never,
          financialTransactionItems: [
            { description: "Coffee", amount: 120, categoryId: 4 },
          ],
        } as never,
        user,
      );
      const createCallsBefore = manager.create.mock.calls.length;
      await service.createOverride(
        {
          walletId: 1,
          amount: 1,
          type: FINANCIAL_TRANSACTION_TYPE.INCOME,
        } as never,
        user,
      );

      // Assert
      expect(result.status).toBe(pending);
      expect(result.createdAt).toEqual(new Date(date));
      expect(result.financialTransactionItems).toEqual([
        expect.objectContaining({
          amount: 120,
          categoryId: 4,
          transactionId: 21,
        }),
      ]);
      expect(manager.create).toHaveBeenCalledWith(
        FinancialTransactionItemEntity,
        expect.objectContaining({ description: "Coffee", amount: 120 }),
      );
      expect(manager.create.mock.calls.length).toBe(createCallsBefore + 1);
    });
  });

  describe("updateOverride", () => {
    const arrangeUpdate = (old: Transaction, wallets: Wallet[]) => {
      manager.findOne.mockResolvedValue(old);
      manager.find.mockResolvedValue(wallets);
      manager.save.mockImplementation(async (value: unknown) => value);
    };

    it("rejects missing or unauthorized transaction and proves transaction callback rejection", async () => {
      // Arrange
      manager.findOne.mockResolvedValue(null);

      // Act and Assert
      await expect(service.updateOverride(11, {}, user)).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it("rolls back completed old transaction and applies updated amount/type/status/wallet", async () => {
      // Arrange
      const old = transaction();
      const oldWallet = wallet(1, 800);
      const newWallet = wallet(2, 500);
      arrangeUpdate(old, [oldWallet, newWallet]);

      // Act
      const result = await service.updateOverride(
        11,
        {
          amount: 100,
          type: FINANCIAL_TRANSACTION_TYPE.INCOME,
          status: completed,
          walletId: 2,
          date: "2026-02-03T00:00:00.000Z" as never,
        } as never,
        user,
      );

      // Assert
      expect(oldWallet.balance).toBe(1_000);
      expect(newWallet.balance).toBe(600);
      expect(result).toEqual(
        expect.objectContaining({
          amount: 100,
          type: FINANCIAL_TRANSACTION_TYPE.INCOME,
          status: completed,
          wallet: newWallet,
          walletId: 2,
          createdAt: new Date("2026-02-03T00:00:00.000Z"),
        }),
      );
      expect(manager.find).toHaveBeenCalledWith(
        FinancialWalletEntity,
        expect.objectContaining({ lock: { mode: "pessimistic_write" } }),
      );
    });

    it("recalculates amount from items for EXPENSE, replaces items, and deletes on empty array", async () => {
      // Arrange
      const old = transaction({ financialTransactionItems: [{ amount: 200 }] });
      const source = wallet(1, 1_000);
      arrangeUpdate(old, [source]);

      // Act
      const replaced = await service.updateOverride(
        11,
        {
          type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
          financialTransactionItems: [
            { description: "A", amount: 30, categoryId: 8 },
            { description: "B", amount: 20 },
          ],
        } as never,
        user,
      );
      const replacedItems = replaced.financialTransactionItems;
      arrangeUpdate(old, [source]);
      const emptied = await service.updateOverride(
        11,
        { financialTransactionItems: [] } as never,
        user,
      );

      // Assert
      expect(replaced.amount).toBe(50);
      expect(replacedItems).toHaveLength(2);
      expect(emptied.financialTransactionItems).toEqual([]);
      expect(manager.delete).toHaveBeenCalledWith(
        FinancialTransactionItemEntity,
        {
          transactionId: 11,
        },
      );
    });

    it.each([
      [FINANCIAL_TRANSACTION_TYPE.EXPENSE, 900],
      [FINANCIAL_TRANSACTION_TYPE.INCOME, 700],
      [FINANCIAL_TRANSACTION_TYPE.REFUND, 700],
      [FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT, 700],
    ])("applies completed %s after rollback", async (type, expected) => {
      // Arrange
      const old = transaction({ type, amount: 200 });
      const source = wallet(1, 800);
      arrangeUpdate(old, [source]);

      // Act
      await service.updateOverride(
        11,
        { type, amount: 100, status: completed } as never,
        user,
      );

      // Assert
      expect(source.balance).toBe(expected);
    });

    it("handles PENDING transitions without applying pending balance changes", async () => {
      // Arrange
      const completedOld = transaction({ amount: 200 });
      const source = wallet(1, 800);
      arrangeUpdate(completedOld, [source]);

      // Act
      await service.updateOverride(11, { status: pending } as never, user);
      expect(source.balance).toBe(1_000);

      const pendingOld = transaction({ status: pending, amount: 200 });
      const pendingSource = wallet(1, 800);
      arrangeUpdate(pendingOld, [pendingSource]);
      await service.updateOverride(
        11,
        { status: completed, amount: 100 } as never,
        user,
      );

      // Assert
      expect(pendingSource.balance).toBe(700);
    });

    it("updates a transfer, locks both wallets, and handles destination errors", async () => {
      // Arrange
      const old = transaction({
        type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
        amount: 100,
      });
      Object.assign(old, { toWalletId: 2 });
      const source = wallet(1, 800);
      const oldDestination = wallet(2, 500);
      const newDestination = wallet(3, 100);
      arrangeUpdate(old, [source, oldDestination, newDestination]);

      // Act
      await service.updateOverride(
        11,
        {
          type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
          amount: 150,
          walletId: 1,
          toWalletId: 3,
          transferFee: 25,
          status: completed,
        } as never,
        user,
      );

      // Assert
      expect(source.balance).toBe(725);
      expect(oldDestination.balance).toBe(400);
      expect(newDestination.balance).toBe(250);
      expect(manager.find).toHaveBeenCalledWith(
        FinancialWalletEntity,
        expect.objectContaining({
          where: expect.arrayContaining([{ id: 1 }, { id: 2 }, { id: 3 }]),
          lock: { mode: "pessimistic_write" },
        }),
      );

      arrangeUpdate(old, [source, oldDestination]);
      await expect(
        service.updateOverride(
          11,
          {
            type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
            amount: 100,
          } as never,
          user,
        ),
      ).rejects.toThrow(BadRequestException);

      arrangeUpdate(old, [source, oldDestination]);
      await expect(
        service.updateOverride(
          11,
          {
            type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
            amount: 100,
            toWalletId: 1,
          } as never,
          user,
        ),
      ).rejects.toThrow(BadRequestException);

      arrangeUpdate(old, [source, oldDestination]);
      await expect(
        service.updateOverride(
          11,
          {
            type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
            amount: 100,
            toWalletId: 4,
          } as never,
          user,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("rejects insufficient transfer balance and propagates manager failures", async () => {
      // Arrange
      const old = transaction({
        type: FINANCIAL_TRANSACTION_TYPE.INCOME,
        amount: 10,
      });
      Object.assign(old, { toWalletId: 2 });
      const source = wallet(1, 100);
      const destination = wallet(2, 10);
      arrangeUpdate(old, [source, destination]);

      // Act and Assert
      await expect(
        service.updateOverride(
          11,
          {
            type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
            amount: 100,
            toWalletId: 2,
            transferFee: 10,
          } as never,
          user,
        ),
      ).rejects.toThrow("Insufficient wallet balance for transfer");

      manager.save.mockRejectedValueOnce(new Error("save failed"));
      arrangeUpdate(transaction(), [wallet(1, 800)]);
      await expect(
        service.updateOverride(11, { amount: 1 } as never, user),
      ).rejects.toThrow("save failed");
    });

    it("rejects insufficient expense and invalid updated type", async () => {
      // Arrange
      const pendingOld = transaction({ status: pending });
      arrangeUpdate(pendingOld, [wallet(1, 50)]);

      // Act and Assert
      await expect(
        service.updateOverride(
          11,
          {
            type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
            amount: 100,
            status: completed,
          } as never,
          user,
        ),
      ).rejects.toThrow("Insufficient wallet balance");

      arrangeUpdate(pendingOld, [wallet(1, 500)]);
      await expect(
        service.updateOverride(
          11,
          { type: "INVALID", amount: 100, status: completed } as never,
          user,
        ),
      ).rejects.toThrow("Invalid transaction type");
    });

    it("keeps existing items when items are omitted", async () => {
      // Arrange
      const old = transaction({ financialTransactionItems: [{ id: 1 }] });
      arrangeUpdate(old, [wallet(1, 800)]);

      // Act
      const result = await service.updateOverride(
        11,
        { amount: 100 } as never,
        user,
      );

      // Assert
      expect(manager.delete).not.toHaveBeenCalled();
      expect(result.financialTransactionItems).toEqual([{ id: 1 }]);
    });
  });

  describe("deleteOverride", () => {
    it("rejects missing transaction or wallet and propagates failure", async () => {
      // Arrange / Act / Assert
      manager.findOne.mockResolvedValueOnce(null);
      await expect(service.deleteOverride(11, user)).rejects.toThrow(
        NotFoundException,
      );

      manager.findOne
        .mockResolvedValueOnce(transaction())
        .mockResolvedValueOnce(null);
      await expect(service.deleteOverride(11, user)).rejects.toThrow(
        NotFoundException,
      );

      manager.findOne
        .mockResolvedValueOnce(transaction())
        .mockResolvedValueOnce(wallet(1, 800));
      manager.save.mockRejectedValueOnce(new Error("rollback failure"));
      await expect(service.deleteOverride(11, user)).rejects.toThrow(
        "rollback failure",
      );
    });

    it.each([
      [FINANCIAL_TRANSACTION_TYPE.EXPENSE, 1_000],
      [FINANCIAL_TRANSACTION_TYPE.INCOME, 600],
      [FINANCIAL_TRANSACTION_TYPE.REFUND, 600],
      [FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT, 600],
      [FINANCIAL_TRANSACTION_TYPE.TRANSFER, 1_000],
    ])(
      "reverses %s and removes items before transaction",
      async (type, expected) => {
        // Arrange
        const old = transaction({ type, wallet: wallet(1, 800) });
        manager.findOne
          .mockResolvedValueOnce(old)
          .mockResolvedValueOnce(old.wallet);

        // Act
        const result = await service.deleteOverride(11, user);

        // Assert
        expect(result).toBe(true);
        expect(old.wallet.balance).toBe(expected);
        expect(manager.delete.mock.invocationCallOrder[0]).toBeLessThan(
          manager.remove.mock.invocationCallOrder[0],
        );
        expect(manager.delete).toHaveBeenCalledWith(
          FinancialTransactionItemEntity,
          {
            transactionId: 11,
          },
        );
        expect(manager.remove).toHaveBeenCalledWith(old);
      },
    );

    it("leaves the balance unchanged for an unknown transaction type", async () => {
      // Arrange
      const old = transaction({
        type: "INVALID" as FINANCIAL_TRANSACTION_TYPE,
      });
      const source = wallet(1, 800);
      manager.findOne.mockResolvedValueOnce(old).mockResolvedValueOnce(source);

      // Act
      await service.deleteOverride(11, user);

      // Assert
      expect(source.balance).toBe(800);
    });
  });

  describe("get", () => {
    it("filters, sorts, paginates, scopes by user and calculates only income/expense totals", async () => {
      // Arrange
      const all = [
        transaction({ amount: 10, type: FINANCIAL_TRANSACTION_TYPE.EXPENSE }),
        transaction({ amount: 20, type: FINANCIAL_TRANSACTION_TYPE.INCOME }),
        transaction({ amount: 30, type: FINANCIAL_TRANSACTION_TYPE.REFUND }),
        transaction({
          amount: 40,
          type: FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT,
        }),
        transaction({ amount: 50, type: FINANCIAL_TRANSACTION_TYPE.TRANSFER }),
      ];
      const pageData = all.slice(0, 2);
      const builder = createQueryBuilder(all, [pageData, 5]);
      transactionRepository.createQueryBuilder.mockReturnValue(builder);

      // Act
      const result = await service.get({
        user,
        query: {
          page: 2,
          limit: 2,
          search: "  coffee  ",
          type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
          status: completed,
          walletId: 1,
          minAmount: 5,
          maxAmount: 100,
          fromDate: "2026-01-01",
          toDate: "2026-01-31",
          sortBy: "amount" as never,
          sortOrder: "ASC" as never,
        },
      });

      // Assert
      expect(result).toEqual({
        data: pageData,
        totalExpense: 10,
        totalIncome: 20,
        meta: { total: 5, page: 2, limit: 2, totalPages: 3 },
      });
      expect(builder.where).toHaveBeenCalledWith(
        "transaction.accountId = :accountId",
        {
          accountId: user.sub,
        },
      );
      expect(builder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining("description ILIKE"),
        { search: "%coffee%" },
      );
      expect(builder.orderBy).toHaveBeenCalledWith("transaction.amount", "ASC");
      expect(builder.skip).toHaveBeenCalledWith(2);
      expect(builder.take).toHaveBeenCalledWith(2);
    });

    it("uses default page, limit, sort and supports an empty result", async () => {
      // Arrange
      const builder = createQueryBuilder([], [[], 0]);
      transactionRepository.createQueryBuilder.mockReturnValue(builder);

      // Act
      const result = await service.get({ user, query: {} });

      // Assert
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
      expect(builder.orderBy).toHaveBeenCalledWith(
        "transaction.createdAt",
        "DESC",
      );
      expect(builder.skip).toHaveBeenCalledWith(0);
      expect(builder.take).toHaveBeenCalledWith(10);
    });
  });

  describe("createAutomatedTransaction", () => {
    it.each([
      [FINANCIAL_TRANSACTION_TYPE.EXPENSE, 800],
      [FINANCIAL_TRANSACTION_TYPE.INCOME, 1_200],
      [FINANCIAL_TRANSACTION_TYPE.REFUND, 1_200],
      [FINANCIAL_TRANSACTION_TYPE.ADJUSTMENT, 1_200],
    ])("creates %s with expected balance", async (type, expected) => {
      // Arrange
      const source = wallet(1);
      manager.findOne.mockResolvedValue(source);

      // Act
      await service.createAutomatedTransaction({
        accountId: 7,
        walletId: 1,
        amount: 200,
        type,
      });

      // Assert
      expect(source.balance).toBe(expected);
      expect(manager.save).toHaveBeenCalledWith(source);
    });

    it("preserves optional fields, date, status, account, original transaction and item", async () => {
      // Arrange
      const source = wallet(1);
      manager.findOne.mockResolvedValue(source);
      manager.save.mockImplementation(async (value: unknown) =>
        value && typeof value === "object" && "type" in value
          ? { id: 55, ...(value as object) }
          : value,
      );
      const date = new Date("2026-03-04T05:06:07.000Z");

      // Act
      const result = await service.createAutomatedTransaction({
        accountId: 7,
        walletId: 1,
        categoryId: 9,
        amount: 20,
        type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        description: "Subscription",
        merchant: "Vendor",
        location: "Online",
        tags: ["monthly"],
        receiptImageUrl: "/receipt.png",
        originalTransactionId: 4,
        date,
        status: pending,
      });

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          description: "Subscription",
          merchant: "Vendor",
          location: "Online",
          tags: ["monthly"],
          receiptImageUrl: "/receipt.png",
          originalTransaction: { id: 4 },
          createdAt: date,
          status: pending,
          account: { id: 7 },
        }),
      );
      expect(manager.create).toHaveBeenCalledWith(
        FinancialTransactionItemEntity,
        expect.objectContaining({
          amount: 20,
          category: { id: 9 },
          transactionId: 55,
        }),
      );
    });

    it("rejects missing wallet, transfer and invalid type; skips item without category", async () => {
      // Arrange / Act / Assert
      manager.findOne.mockResolvedValueOnce(null);
      await expect(
        service.createAutomatedTransaction({
          accountId: 7,
          walletId: 1,
          amount: 1,
          type: FINANCIAL_TRANSACTION_TYPE.EXPENSE,
        }),
      ).rejects.toThrow(NotFoundException);

      manager.findOne.mockResolvedValueOnce(wallet(1));
      await expect(
        service.createAutomatedTransaction({
          accountId: 7,
          walletId: 1,
          amount: 1,
          type: FINANCIAL_TRANSACTION_TYPE.TRANSFER,
        }),
      ).rejects.toThrow(BadRequestException);

      manager.findOne.mockResolvedValueOnce(wallet(1));
      await expect(
        service.createAutomatedTransaction({
          accountId: 7,
          walletId: 1,
          amount: 1,
          type: "INVALID" as FINANCIAL_TRANSACTION_TYPE,
        }),
      ).rejects.toThrow(BadRequestException);

      manager.findOne.mockResolvedValueOnce(wallet(1));
      await service.createAutomatedTransaction({
        accountId: 7,
        walletId: 1,
        amount: 1,
        type: FINANCIAL_TRANSACTION_TYPE.INCOME,
      });
      expect(manager.create).not.toHaveBeenCalledWith(
        FinancialTransactionItemEntity,
        expect.anything(),
      );
    });
  });

  describe("view", () => {
    it("loads all requested relations and returns an owned transaction", async () => {
      // Arrange
      const found = transaction();
      const builder = createQueryBuilder([], [[], 0], found);
      transactionRepository.createQueryBuilder.mockReturnValue(builder);

      // Act
      const result = await service.view(11, user);

      // Assert
      expect(result).toBe(found);
      expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
        "transaction.wallet",
        "wallet",
      );
      expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
        "transaction.financialTransactionItems",
        "financialTransactionItems",
      );
      expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
        "financialTransactionItems.category",
        "category",
      );
      expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
        "transaction.originalTransaction",
        "originalTransaction",
      );
      expect(builder.leftJoinAndSelect).toHaveBeenCalledWith(
        "originalTransaction.financialTransactionItems",
        "originalTransactionItems",
      );
      expect(builder.where).toHaveBeenCalledWith("transaction.id = :id", {
        id: 11,
      });
      expect(builder.andWhere).toHaveBeenCalledWith(
        "transaction.accountId = :accountId",
        { accountId: user.sub },
      );
    });

    it("throws when transaction is not found or belongs to another user", async () => {
      // Arrange
      const builder = createQueryBuilder([], [[], 0], null);
      transactionRepository.createQueryBuilder.mockReturnValue(builder);

      // Act and Assert
      await expect(service.view(11, user)).rejects.toThrow(NotFoundException);
      builder.getOne.mockResolvedValue(null);
      await expect(service.view(12, user)).rejects.toThrow(NotFoundException);
    });
  });
});
