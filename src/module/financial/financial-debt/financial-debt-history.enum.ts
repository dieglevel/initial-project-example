export enum FINANCIAL_DEBT_HISTORY_TYPE_ENUM {
  CREATED = "CREATED",
  PAYMENT = "PAYMENT",
  ADJUSTMENT = "ADJUSTMENT",
  SETTLED = "SETTLED",
  PAID_OFF = "PAID_OFF",
  CANCELLED = "CANCELLED",
  CORRECTED = "CORRECTED",
  /** Vay / cho vay thêm vào khoản đang có */
  INCREASED = "INCREASED",
  /** Khoản đích nhận dư nợ từ khoản được gộp */
  MERGED_IN = "MERGED_IN",
  /** Khoản nguồn đã gộp sang khoản khác */
  MERGED_OUT = "MERGED_OUT",
  /** Phần thu / trả vượt dư nợ (tiền lãi) */
  INTEREST = "INTEREST",
}
