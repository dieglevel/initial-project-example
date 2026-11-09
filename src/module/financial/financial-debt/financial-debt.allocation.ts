import { round2 } from "../financial-wallet/wallet-balance.helper";

export interface DebtAllocationInput {
  id: number;
  startDate: string;
  outstandingAmount: number;
}

export interface DebtAllocation {
  id: number;
  amount: number;
}

/** Chuẩn hóa tên người để nhóm: bỏ khoảng trắng thừa, không phân biệt hoa thường */
export const normalizePersonName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Phân bổ số tiền thanh toán theo FIFO: khoản bắt đầu sớm nhất được trả trước.
 * Trả về danh sách khoản nhận tiền (bỏ qua khoản nhận 0).
 * Trả dư so với tổng dư nợ: phần dư dồn vào khoản mới nhất
 * (applyPayment ghi phần đó là tiền lãi).
 */
export const allocateFifo = (
  debts: DebtAllocationInput[],
  amount: number,
): DebtAllocation[] => {
  const sorted = [...debts].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id,
  );
  const allocations: DebtAllocation[] = [];
  let remaining = round2(amount);

  for (const debt of sorted) {
    if (remaining <= 0) break;
    const outstanding = round2(Number(debt.outstandingAmount));
    if (outstanding <= 0) continue;
    const portion = Math.min(outstanding, remaining);
    allocations.push({ id: debt.id, amount: portion });
    remaining = round2(remaining - portion);
  }

  const newest = sorted[sorted.length - 1];
  if (remaining > 0 && newest) {
    const last = allocations.find((a) => a.id === newest.id);
    if (last) last.amount = round2(last.amount + remaining);
    else allocations.push({ id: newest.id, amount: remaining });
  }

  return allocations;
};

/** Tách số tiền thanh toán thành phần trừ dư nợ và phần dư (tiền lãi) */
export const splitPayment = (outstanding: number, amount: number) => {
  const principal = Math.min(round2(outstanding), round2(amount));
  return { principal, excess: round2(amount - principal) };
};
