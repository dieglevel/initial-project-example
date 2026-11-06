export enum FINANCIAL_GOAL_HISTORY_SOURCE {
  USER = "USER",
  SYSTEM = "SYSTEM",
}

export enum FINANCIAL_GOAL_HISTORY_STATUS {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  SKIPPED = "SKIPPED",
}

/** Chiều tiền của một dòng lịch sử: góp vào mục tiêu hay rút ra */
export enum FINANCIAL_GOAL_HISTORY_TYPE {
  CONTRIBUTION = "CONTRIBUTION",
  WITHDRAWAL = "WITHDRAWAL",
}
