import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { EntityManager } from "typeorm";
import { FinancialWalletEntity } from "./_entities/financial-wallet.entity";

/** Làm tròn 2 chữ số thập phân cho tiền */
export const round2 = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Cộng/trừ số dư ví trong transaction hiện tại. KHÔNG tạo financial transaction
 * (dùng cho các nghiệp vụ không tính là thu/chi: nợ, mục tiêu tiết kiệm).
 *
 * - Ví phải thuộc account (404 nếu không).
 * - Đọc số dư dưới khóa pessimistic_write để tránh ghi đè đồng thời.
 * - Không cho số dư âm (400 "Insufficient wallet balance").
 */
export const applyWalletBalanceChange = async (
  manager: EntityManager,
  walletId: number,
  accountId: number,
  delta: number,
): Promise<FinancialWalletEntity> => {
  // Kiểm tra quyền sở hữu (query có join relation nên không khóa ở đây)
  const owned = await manager.findOne(FinancialWalletEntity, {
    where: { id: walletId, account: { id: accountId } },
  });
  if (!owned) {
    throw new NotFoundException("Financial wallet not found");
  }

  // Đọc lại số dư mới nhất dưới khóa
  const wallet = await manager.findOneOrFail(FinancialWalletEntity, {
    where: { id: walletId },
    lock: { mode: "pessimistic_write" },
  });

  const newBalance = round2(Number(wallet.balance) + delta);
  if (newBalance < 0) {
    throw new BadRequestException("Insufficient wallet balance");
  }

  wallet.balance = newBalance;
  return manager.save(wallet);
};
