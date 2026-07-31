export class FinancialReport_NetWorthTimelineItem_Response {
  label: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export class FinancialReport_NetWorth_Response {
  assets: number;
  liabilities: number;
  netWorth: number;
  timeline: FinancialReport_NetWorthTimelineItem_Response[];
}
